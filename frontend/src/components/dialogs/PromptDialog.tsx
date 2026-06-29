import { useState } from 'react'
import type { Destination } from '../../destinations'
import { Button, Modal, ModalActions, ModalTitle } from '../Modal'
import { Field } from '../Field'

/** Collects publish-time input (e.g. a title) for destinations that need it. */
export function PromptDialog({
  dest,
  onCancel,
  onSubmit,
}: {
  dest: Destination
  onCancel: () => void
  onSubmit: (dest: Destination, values: Record<string, string>) => void
}) {
  const fields = dest.prompt ?? []
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, ''])),
  )
  const canSubmit = fields.every((f) => f.optional || values[f.key]?.trim())

  return (
    <Modal onClose={onCancel}>
      <ModalTitle>
        {dest.icon} Publish to {dest.name}
      </ModalTitle>
      {fields.map((f, i) => (
        <Field
          key={f.key}
          field={f}
          value={values[f.key]}
          autoFocus={i === 0}
          onChange={(value) => setValues((v) => ({ ...v, [f.key]: value }))}
          onEnter={() => canSubmit && onSubmit(dest, values)}
        />
      ))}
      <ModalActions>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!canSubmit} onClick={() => onSubmit(dest, values)}>
          Publish
        </Button>
      </ModalActions>
    </Modal>
  )
}
