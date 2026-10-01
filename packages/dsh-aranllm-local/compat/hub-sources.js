/*
 * The file-list confirmation, shared by both hosts.
 *
 * A separate module rather than a helper here, because it is the one thing in
 * this file that is *not* about a host's differences — both mirrors are asked
 * the same question and answered the same way.
 */
import { confirmGguf } from './gguf-verify.js';
/* ── Shared helpers ──────────────────────────────────────────────────────── */
/**
 * Read a quantisation label out of a file name.
 *
 * Five shapes cover every name measured in the wild, tried in this order:
 *
 * 1. `UD-<label>` — Unsloth's prefix, where the label after it is the answer.
 * 2. `IQ<n>_<suffix>` — one to three letters, so `IQ2_S` and `IQ2_XXS` both read
 *    whole. Tried before the `Q<n>_` shape, which would match a prefix of it.
 * 3. `Q<n>_<A>_<B>` — the `Q4_K_M` / `Q3_K_S` family, with the trailing part
 *    optional so a bare `Q6_K` reads too.
 * 4. `Q<n>_<digit>` — `Q8_0`, `Q4_1`. A separate shape, not a case of (3):
 *    the suffix here is a digit and the one there is a letter, and a single
 *    pattern cannot take both without also matching `Q4_0_K`.
 * 5. A dtype name: `BF16`, `F16`, `FP8`, `FP4`.
 *
 * The dtype shape deliberately has no leading `\b`. Measured on
 * `Qwen3.8-27B-ROCmFP4-FAST`: the `FP4` there is preceded by a letter, so
 * `\bFP4\b` does not match it, and the one label that file has went unreported.
 *
 * Shard suffixes need no special handling; `-00001-of-00002` is not matched by
 * any of these because each label is anchored on `_` or a word boundary.
 *
 * Reported as `undefined` when nothing matches, rather than a guess: a wrong
 * label on a 40 GB download is worse than no label.
 */
export function quantizationOf(name) {
    const upper = name.toUpperCase();
    const patterns = [
        /\bUD-(IQ\d[_A-Z0-9]*|Q\d[_A-Z0-9]*)/,
        /\b(IQ\d_[A-Z]{1,3}(?:_[A-Z]{1,3})?)\b/,
        /\b(Q\d_[A-Z](?:_[A-Z])?)\b/,
        /\b(Q\d_\d)\b/,
        /(BF16|F16|F32|FP16|FP8|FP4)/
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(upper);
        if (match?.[1])
            return match[1];
    }
    return undefined;
}
/** Tags that are metadata rather than a description of the model. */
function usefulTags(tags) {
    if (!Array.isArray(tags))
        return [];
    const out = [];
    for (const tag of tags) {
        if (typeof tag !== 'string')
            continue;
        /*
         * Filtered rather than truncated: `license:apache-2.0`, `region:us` and
         * `base_model:...` are the same on most repositories and would push the two
         * or three that describe the model off the end of a short list.
         */
        if (/^(license|region|base_model|arxiv|dataset|deploy|endpoints_compatible)/i.test(tag))
            continue;
        if (tag === 'transformers' || tag === 'safetensors' || tag === 'conversational')
            continue;
        out.push(tag);
        if (out.length >= 4)
            break;
    }
    return out;
}
/** Only GGUF files, and only the ones a session could actually load. */
function ggufOnly(files) {
    return files.filter((file) => file.path.toLowerCase().endsWith('.gguf'));
}
/** Sum the GGUF bytes in a listing. */
function totalGguf(files) {
    let total = 0;
    for (const file of files) {
        if (file.path.toLowerCase().endsWith('.gguf') && file.size !== undefined)
            total += file.size;
    }
    return total;
}
/**
 * A JSON request with the error taxonomy the page needs.
 *
 * Shared by both hosts because the failure modes are the same even where the
 * verbs are not: a name that does not resolve, a host that does not answer, a
 * body that is not JSON. Telling those apart is what lets the page offer "retry"
 * for one and "change the mirror" for another.
 */
async function requestJson(url, init, host) {
    let response;
    try {
        response = await fetch(url, init);
    }
    catch (cause) {
        const detail = cause instanceof Error ? cause.message : String(cause);
        const timedOut = cause instanceof Error && cause.name === 'TimeoutError';
        return {
            ok: false,
            error: timedOut
                ? `${host} 响应太慢，可以稍后重试或换个源。`
                : `无法连接 ${host}：${detail}`
        };
    }
    if (response.status === 404) {
        return { ok: false, error: '这个仓库或文件不存在，检查一下名字有没有拼错。' };
    }
    if (response.status === 401 || response.status === 403) {
        /*
         * Both readings are given, because the response cannot be told apart.
         *
         * Measured: asking hf-mirror for a repository that does not exist answers
         * **401**, not 404 — Hugging Face does not distinguish "no such repository"
         * from "not allowed to see it", so that the existence of a private
         * repository is not disclosed by the error code. Reporting only one of the
         * two would make the most likely mistake (a typo in a name) read as a
         * permissions problem.
         */
        return {
            ok: false,
            error: `仓库不存在，或需要授权才能访问（HTTP ${String(response.status)}）。请检查名字是否拼错。`
        };
    }
    if (response.status === 429) {
        return { ok: false, error: '请求过于频繁，稍等一会儿再试。' };
    }
    if (!response.ok) {
        return { ok: false, error: `${host} 返回 HTTP ${String(response.status)}。` };
    }
    try {
        return {
            ok: true,
            value: { body: (await response.json()), link: response.headers.get('link') }
        };
    }
    catch {
        return { ok: false, error: `${host} 返回的不是 JSON，可能这个地址不是模型源。` };
    }
}
/* ── hf-mirror ───────────────────────────────────────────────────────────── */
const HF_ORIGIN = 'https://hf-mirror.com';
/**
 * The cursor in a `Link: <...>; rel="next"` header, or undefined.
 *
 * Only the cursor is taken; the URL around it is discarded on purpose. The API
 * answers with `huggingface.co` in that header even when asked through a mirror,
 * so reusing the URL would send the second page to a different host from the
 * first. Extracting the one opaque parameter and re-framing it against this
 * source's own origin keeps a paged session on one host.
 */
function hfCursor(link) {
    if (!link)
        return undefined;
    const next = /<([^>]+)>\s*;\s*rel="next"/.exec(link)?.[1];
    if (!next)
        return undefined;
    try {
        return new URL(next).searchParams.get('cursor') ?? undefined;
    }
    catch {
        return undefined;
    }
}
function hfRepo(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const record = raw;
    const id = typeof record.id === 'string' ? record.id : typeof record.modelId === 'string' ? record.modelId : '';
    if (id.length === 0)
        return undefined;
    const all = Array.isArray(record.tags) ? record.tags.filter((tag) => typeof tag === 'string') : [];
    return {
        id,
        downloads: typeof record.downloads === 'number' ? record.downloads : 0,
        likes: typeof record.likes === 'number' ? record.likes : 0,
        updatedAt: typeof record.updatedAt === 'string'
            ? record.updatedAt
            : typeof record.createdAt === 'string'
                ? record.createdAt
                : '',
        hasGguf: all.includes('gguf'),
        tags: usefulTags(record.tags)
    };
}
function hfFile(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const record = raw;
    const path = typeof record.rfilename === 'string' ? record.rfilename : '';
    if (path.length === 0)
        return undefined;
    const name = path.split('/').pop() ?? path;
    const quantization = quantizationOf(name);
    return {
        path,
        ...(typeof record.size === 'number' && record.size >= 0 ? { size: record.size } : {}),
        ...(quantization ? { quantization } : {}),
        isProjector: /mmproj/i.test(name)
    };
}
const hfMirror = {
    id: 'hf-mirror',
    label: 'hf-mirror',
    origin: HF_ORIGIN,
    async search(query, signal) {
        const params = new URLSearchParams();
        const text = query.search?.trim() ?? '';
        if (text.length > 0)
            params.set('search', text);
        /*
         * `gguf` is the default filter rather than something to discover: this
         * application loads GGUF files, and a list where most entries cannot be
         * used is a worse default than a shorter list that can. Unlike ModelScope,
         * this host honours it.
         */
        params.set('filter', 'gguf');
        params.set('sort', query.sort?.trim() || 'downloads');
        params.set('direction', query.descending === false ? '1' : '-1');
        params.set('limit', String(Math.min(Math.max(query.limit ?? 30, 1), 100)));
        if (query.page)
            params.set('cursor', query.page);
        const answer = await requestJson(`${HF_ORIGIN}/api/models?${params.toString()}`, { headers: { accept: 'application/json' }, signal }, 'hf-mirror');
        if (!answer.ok)
            return answer;
        const rows = Array.isArray(answer.value.body) ? answer.value.body : [];
        /*
         * The tag is re-checked here rather than trusted. The API does honour
         * `filter=gguf`, but this is the one hard requirement — a repository with
         * no GGUF file cannot be loaded by anything here — and an entry that
         * slipped through would offer a click through to an empty file list.
         */
        const labelled = rows
            .map(hfRepo)
            .filter((repo) => repo !== undefined)
            /*
             * The host's `filter=gguf` is a tag, and a tag is a claim.
             *
             * It is honoured here — it removes most of a page for free — but what
             * survives it is then confirmed against the repository's own file list.
             * See `gguf-verify.ts` for why the confirmation is worth a request per
             * surviving row and why a failed read counts as "no".
             */
            .filter((repo) => repo.hasGguf);
        const repos = await confirmGguf(labelled, (id, inner) => hfMirror.files(id, inner), signal);
        const cursor = hfCursor(answer.value.link);
        return { ok: true, value: { repos, ...(cursor ? { nextPage: cursor } : {}) } };
    },
    async files(repoId, signal) {
        const id = repoId.trim();
        if (id.length === 0)
            return { ok: false, error: '请填写仓库名，形如 `发布者/模型`。' };
        /*
         * `blobs=true` is not optional — without it `siblings` carries no sizes, and
         * a download UI without sizes cannot show progress against a total or warn
         * that a pick is 46 GB.
         */
        const answer = await requestJson(`${HF_ORIGIN}/api/models/${id}?blobs=true`, { headers: { accept: 'application/json' }, signal }, 'hf-mirror');
        if (!answer.ok)
            return answer;
        const record = answer.value.body;
        const rows = Array.isArray(record?.siblings) ? record.siblings : [];
        const files = ggufOnly(rows.map(hfFile).filter((file) => file !== undefined));
        return { ok: true, value: { id, files, ggufBytes: totalGguf(files) } };
    },
    downloadUrl(repoId, file) {
        return `${HF_ORIGIN}/${repoId}/resolve/main/${file}`;
    }
};
/* ── ModelScope ──────────────────────────────────────────────────────────── */
const MS_ORIGIN = 'https://modelscope.cn';
/** ModelScope reports a directory as a zero-byte entry with this type. */
const MS_TREE = 'tree';
/**
 * ModelScope's timestamps, as an ISO string.
 *
 * This host reports Unix **seconds as a number** where hf-mirror reports an ISO
 * string. Passed through unchanged, `Date.parse` of a bare number returns NaN
 * and the "updated" column is silently empty — no error, just a blank where a
 * date belongs. Normalised here so both hosts hand the page the same thing.
 */
function msTime(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return new Date(value * 1000).toISOString();
    }
    if (typeof value === 'string' && value.length > 0) {
        /* Tolerated in case a future revision starts sending ISO directly. */
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? new Date(parsed).toISOString() : '';
    }
    return '';
}
function msRepo(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const record = raw;
    const name = typeof record.Name === 'string' ? record.Name : '';
    const owner = typeof record.Path === 'string' ? record.Path : '';
    if (name.length === 0)
        return undefined;
    const id = owner.length > 0 ? `${owner}/${name}` : name;
    const tags = Array.isArray(record.Tags)
        ? record.Tags.map((tag) => (typeof tag === 'string' ? tag : tag?.Name))
            .filter((tag) => typeof tag === 'string')
        : [];
    return {
        id,
        downloads: typeof record.Downloads === 'number' ? record.Downloads : 0,
        /* `Stars` here, `likes` there — the same idea under two names. */
        likes: typeof record.Stars === 'number' ? record.Stars : 0,
        updatedAt: msTime(record.LastUpdatedTime) || msTime(record.CreatedTime),
        /*
         * Read from `Libraries`, which this host derives from the repository's own
         * files — not from `Tags`, which the uploader typed.
         *
         * The distinction is what makes this reliable. Measured on four searches:
         * `llama` and `deepseek` return ten results each with `gguf` in neither
         * `Libraries` nor `Tags`, `gguf` returns ten with it in both, and `qwen`
         * returns ten of which three have it. The two fields agreed on every row —
         * but `Tags` is a claim by the person who uploaded the model and `Libraries`
         * is the platform's own reading of what is in the repo, and a claim can be
         * missing while a reading cannot.
         *
         * An earlier version returned a constant `true` here, on the reasoning that
         * a name search was as good a sign as this host offered. It was not: a
         * search for `qwen` showed ten repositories and only three of them carried
         * anything this application could load, which is the report this fixes.
         *
         * A repository with no `Libraries` at all reports `false`. That is the
         * conservative direction — the cost of hiding something usable is that the
         * user searches again, and the cost of showing something unusable is a
         * download that ends in a file the model library refuses.
         */
        hasGguf: Array.isArray(record.Libraries)
            ? record.Libraries.some((entry) => {
                const value = typeof entry === 'string' ? entry : (entry?.Name ?? '');
                return typeof value === 'string' && value.toLowerCase() === 'gguf';
            })
            : false,
        tags: usefulTags(tags)
    };
}
function msFile(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const record = raw;
    if (record.Type === MS_TREE)
        return undefined;
    const path = typeof record.Path === 'string' ? record.Path : '';
    if (path.length === 0)
        return undefined;
    const name = path.split('/').pop() ?? path;
    const quantization = quantizationOf(name);
    /*
     * `Size: 0` is what this host sends for a directory, and it reaches here for
     * a file only if the entry type was missing. Normalised to undefined so the
     * caller tests one thing.
     */
    const size = typeof record.Size === 'number' && record.Size > 0 ? record.Size : undefined;
    return {
        path,
        ...(size !== undefined ? { size } : {}),
        ...(quantization ? { quantization } : {}),
        isProjector: /mmproj/i.test(name),
        ...(typeof record.Sha256 === 'string' && record.Sha256.length > 0 ? { sha256: record.Sha256 } : {})
    };
}
const modelScope = {
    id: 'modelscope',
    label: '魔搭社区',
    origin: MS_ORIGIN,
    async search(query, signal) {
        const text = query.search?.trim() ?? '';
        /*
         * A PUT, with a JSON body. Measured: the GET and POST forms of this path
         * both answer "404 page not found", and PUT is what the site itself uses.
         * An unusual verb for a search — but it is the one that works.
         */
        /*
         * The search term goes in `Name`, and that is not a guess.
         *
         * Measured against this host, asking for `gguf` through each candidate
         * field in turn: `Target`, `Search`, `Keyword` and `Query` all return the
         * unfiltered front page, while `Name` returns exactly the repositories with
         * `gguf` in their name. `Target` looks like the right one and is not — it
         * is accepted and ignored, which is the failure that leaves a search box
         * looking broken while every request succeeds.
         *
         * `SingleCriterion` is sent empty because tag filtering genuinely is not
         * supported here (measured: a `tags contains gguf` criterion returns the
         * same front page as no criterion at all). Searching the name is what
         * works, so that is what the caller's query becomes.
         */
        const body = {
            PageSize: Math.min(Math.max(query.limit ?? 30, 1), 100),
            PageNumber: Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1),
            SortBy: 'Default',
            Name: text,
            Target: '',
            SingleCriterion: []
        };
        const answer = await requestJson(`${MS_ORIGIN}/api/v1/dolphin/models`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify(body),
            signal
        }, '魔搭');
        if (!answer.ok)
            return answer;
        const record = answer.value.body;
        if (record?.Code !== 200) {
            return { ok: false, error: `魔搭返回错误码 ${String(record?.Code ?? '未知')}。` };
        }
        const model = record?.Data?.Model;
        const rows = Array.isArray(model?.Models) ? model.Models : [];
        const total = typeof model?.TotalCount === 'number' ? model.TotalCount : 0;
        /*
         * Filtered here as well as on hf-mirror, and the omission was the bug.
         *
         * The sibling branch has always had this line; this one did not, so even
         * once `msRepo` learned to read `Libraries` the results would all have been
         * shown — a repository of `.safetensors` shards listed beside one that can
         * actually be loaded here.
         *
         * Both halves are needed: without the flag there is nothing to filter on,
         * and without the filter the flag is read and discarded.
         */
        const labelled = rows
            .map(msRepo)
            .filter((repo) => repo !== undefined)
            /*
             * `Libraries` is derived by the platform from the repository's files,
             * which makes it better than a tag and still not the files themselves.
             * It filters for free; the survivors are confirmed against the listing.
             */
            .filter((repo) => repo.hasGguf);
        const repos = await confirmGguf(labelled, (id, inner) => modelScope.files(id, inner), signal);
        /*
         * The next page is a number, and only offered when another page exists.
         * Measured: this host does report `TotalCount`, so the end is knowable
         * without asking for an empty page and reading the result.
         */
        const page = body.PageNumber;
        const hasMore = total > 0 && page * body.PageSize < total;
        return { ok: true, value: { repos, ...(hasMore ? { nextPage: String(page + 1) } : {}) } };
    },
    async files(repoId, signal) {
        const id = repoId.trim();
        if (id.length === 0)
            return { ok: false, error: '请填写仓库名，形如 `发布者/模型`。' };
        /*
         * Walked breadth-first because this host returns one directory at a time:
         * a GGUF sitting in `Q4_K_M/` is not in the root listing at all, and the
         * root listing is the only one a single request can reach.
         *
         * Bounded on both axes — depth and directory count — because a repository
         * is remote input and a pathological one (a thousand folders, or a cycle
         * through symlinks) must not turn a page open into an unbounded walk.
         */
        const MAX_DEPTH = 4;
        const MAX_DIRS = 40;
        const files = [];
        const visited = new Set();
        const queue = [{ root: '', depth: 0 }];
        while (queue.length > 0 && visited.size < MAX_DIRS) {
            const next = queue.shift();
            if (!next)
                break;
            if (visited.has(next.root))
                continue;
            visited.add(next.root);
            const answer = await requestJson(`${MS_ORIGIN}/api/v1/models/${id}/repo/files?Revision=master&Root=${encodeURIComponent(next.root)}`, { headers: { accept: 'application/json' }, signal }, '魔搭');
            if (!answer.ok) {
                /*
                 * The root listing failing is the whole request failing. A subdirectory
                 * failing is not — the files already collected are still valid, and
                 * losing them to a transient error on one folder would be worse than
                 * reporting what was found.
                 */
                if (next.depth === 0)
                    return answer;
                continue;
            }
            const record = answer.value.body;
            /*
             * `Data.Files`, not `Data`. Measured: `Data` is an object carrying `Files`,
             * `IsVisual` and `LatestCommitter`. Reading the array off `Data` itself
             * yields nothing and raises nothing, so every repository — including ones
             * with thirty-three files — reports an empty list.
             */
            const payload = record?.Data;
            const rows = Array.isArray(payload?.Files) ? payload.Files : [];
            for (const row of rows) {
                const entry = row;
                if (entry.Type === MS_TREE) {
                    if (next.depth + 1 <= MAX_DEPTH) {
                        const name = typeof entry.Path === 'string' ? entry.Path : '';
                        if (name.length > 0)
                            queue.push({ root: name, depth: next.depth + 1 });
                    }
                    continue;
                }
                const file = msFile(row);
                if (file)
                    files.push(file);
            }
        }
        const gguf = ggufOnly(files);
        return { ok: true, value: { id, files: gguf, ggufBytes: totalGguf(gguf) } };
    },
    downloadUrl(repoId, file) {
        /* `master`, not `main` — measured, and a wrong branch is a 404. */
        return `${MS_ORIGIN}/models/${repoId}/resolve/master/${file}`;
    }
};
/* ── The registry ────────────────────────────────────────────────────────── */
export const SOURCES = {
    'hf-mirror': hfMirror,
    modelscope: modelScope
};
export const SOURCE_LIST = [hfMirror, modelScope];
export const DEFAULT_SOURCE = 'hf-mirror';
/** Narrow a stored value to a known source, falling back to the default. */
export function asSourceId(value) {
    return value === 'modelscope' || value === 'hf-mirror' ? value : DEFAULT_SOURCE;
}
export function sourceFor(id) {
    return SOURCES[asSourceId(id)];
}
