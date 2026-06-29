import { Button, Modal, ModalNote, ModalTitle } from '../Modal'

/** Shown when the user tries to add an image but no image host is configured.
 *  Offers the two ways forward: host it yourself, or go Pro. */
export function ImageUploadDialog({
  onConfigure,
  onUpgrade,
  onClose,
}: {
  onConfigure: () => void
  onUpgrade: () => void
  onClose: () => void
}) {
  return (
    <Modal onClose={onClose}>
      <ModalTitle>Add an image</ModalTitle>
      <ModalNote>
        Images need somewhere to live. Bring your own storage for free, e.g. a GitHub repository, or upgrade to Pro and let us handle it.
      </ModalNote>
      <Button className="w-full" onClick={onConfigure}>
        Configure image host
      </Button>
      <Button variant="ghost" className="w-full" onClick={onUpgrade}>
        Upgrade to Pro
      </Button>
    </Modal>
  )
}
