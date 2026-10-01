import { readFileSync, writeFileSync } from 'node:fs'

const file = 'client.js'
const lines = readFileSync(file, 'utf8').split('\n')

// 1-indexed 1306..1401 -> 0-indexed 1305..1400
const start = 1305
const end = 1401

if (!lines[start].includes('const header = React.createElement')) {
  console.error('起始行不对:', JSON.stringify(lines[start]))
  process.exit(1)
}
if (lines[end].trim() !== '}') {
  console.error('结束行不对:', JSON.stringify(lines[end]))
  process.exit(1)
}

const replacement = `      /*
       * The form is a modal, as the desktop application drew it.
       *
       * An inline section was tried and it is the wrong shape for this: the
       * panel carries thirty-four fields across five groups, and in the page
       * flow it pushes everything below it out of view — including the list of
       * models the settings it edits belong to. A dialog keeps the list where
       * it was and puts the form over it, which is also what makes "cancel" a
       * real answer rather than "scroll back up".
       *
       * \`Modal\` from the host owns the layer, the mask, the escape key and the
       * focus trap. A hand-rolled overlay would have to re-implement all four
       * and would get the last two subtly wrong.
       */
      const preset = (values) => {
        const next = { ...draft }
        for (const [key, value] of Object.entries(values)) next[key] = value
        setDraft(next)
      }

      const body = React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        React.createElement(
          'span',
          { className: 'text-14-regular text-text-weak' },
          remembered ? t('paramsRemembered') : t('paramsNone')
        ),

        /*
         * The three speed presets, as named bundles rather than a slider.
         *
         * The values are not a continuum — they are three coherent answers to
         * "what is this model for" — and picking between them is the decision a
         * user is actually making. They only fill the fields below; saving is
         * still a separate act, which the note under them says out loud.
         */
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement(
            'span',
            { className: 'text-14-medium text-text-strong' },
            t('paramsSpeed')
          ),
          ...PRESETS.map((entry) =>
            React.createElement(
              Button,
              {
                key: entry.id,
                variant: 'outline',
                size: 'sm',
                title: entry.note,
                onClick: () => preset(entry.values),
              },
              entry.label,
            ),
          ),
        ),
        React.createElement(
          'span',
          { className: 'text-14-regular text-text-weak' },
          t('paramsPresetNote'),
        ),

        // Grouped and collapsed, because thirty-four fields at once is a wall
        // and the common edit is context length or GPU offload.
        ...(groups ?? []).map((group) =>
          React.createElement(
            DisclosureRow,
            {
              key: group.id,
              label: group.title,
              defaultOpen: group.id === 'context',
            },
            React.createElement(
              'div',
              { className: 'flex flex-col gap-2' },
              ...group.fields.map((field) =>
                React.createElement(ParameterField, {
                  key: field.key,
                  field,
                  t,
                  draft,
                  setDraft,
                }),
              ),
            ),
          ),
        ),

        React.createElement(
          'span',
          { className: 'text-14-regular text-text-weak' },
          t('paramsBySection'),
        ),

        error
          ? React.createElement(
              'span',
              { className: 'flex items-center gap-2 text-14-regular text-text-danger' },
              React.createElement(IconWarningTriangleOutlineRegular, { size: 14 }),
              error,
            )
          : null,
      )

      const footer = React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement(
          Button,
          { variant: 'primary', size: 'sm', disabled: busy, onClick: () => void save() },
          t('paramsSave'),
        ),
        React.createElement(
          Button,
          { variant: 'ghost', size: 'sm', disabled: busy, onClick: () => void reset() },
          t('paramsReset'),
        ),
        status
          ? React.createElement(
              'span',
              { className: 'text-14-regular text-text-weak' },
              status,
            )
          : null,
      )

      return React.createElement(
        Modal,
        {
          open,
          onClose: () => setOpen(undefined),
          title: t('paramsTitle'),
          description: \`\${t('paramsFor')} \${model.name ?? model.id}\`,
          footer,
        },
        body,
      )
    }`

const out = [...lines.slice(0, start), replacement, ...lines.slice(end + 1)]
writeFileSync(file, out.join('\n'))
console.log('已替换', end - start + 1, '行')
