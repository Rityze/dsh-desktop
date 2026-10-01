import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Modal.
 *
 * A centred card over a dimmed backdrop, used for anything that asks the user
 * for a short piece of text before it can act — naming a project, renaming a
 * session, setting a model alias.
 *
 * Centred on the window rather than positioned inside whatever opened it. A text
 * field in a 240px sidebar loses its own right edge to the panel's 8px padding
 * and its label to truncation, and the room it needs is the room the window has.
 * The backdrop is what makes that read as a layer rather than as a field that
 * escaped its box.
 *
 * Rendered into `document.body` through a portal, which is what makes "centred
 * on the window" true rather than intended. `.shell__main` carries
 * `contain: strict`, and `contain` makes an element a containing block for
 * fixed-position descendants — so `inset: 0` on the backdrop would fill the main
 * pane, not the window, and the card would centre 240px left of where it should
 * be. The portal puts the backdrop back on the viewport.
 *
 * No focus trap. The application has one window and one modal at a time, and
 * there is nothing behind the backdrop that a Tab could usefully reach anyway.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './modal.css';
export function Modal({ open, title, onClose, children, actions, size = 'compact' }) {
    const card = useRef(null);
    /*
     * Escape closes. Bound on the document rather than on the card because focus
     * may be on the backdrop after a click, and a key handler on the card would
     * then never see the key.
     */
    useEffect(() => {
        if (!open)
            return undefined;
        const onKey = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    return createPortal(_jsx("div", { className: "modal", 
        /*
         * A click on the backdrop closes, a click on the card must not. Testing the
         * target against the backdrop's own node is what distinguishes them;
         * stopping propagation inside the card would also swallow clicks that
         * bubble up from the fields the caller put there.
         */
        onMouseDown: (event) => {
            if (event.target === event.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "modal__card", "data-size": size, ref: card, role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsx("div", { className: "modal__title", children: title }), _jsx("div", { className: "modal__body", children: children }), actions ? _jsx("div", { className: "modal__actions", children: actions }) : null] }) }), document.body);
}
