import { uploadStory } from '../lib/supabase'
import CameraCapture from './CameraCapture'

// Tynn wrapper: kamera-i-nettleser (CameraCapture) → last opp som story.
export default function StoryComposer({
  onClose,
  onUploaded,
}: {
  onClose: () => void
  onUploaded: () => void
}) {
  return (
    <CameraCapture
      defaultFacing="environment"
      confirmLabel="Legg ut story"
      onConfirm={async (blob) => {
        await uploadStory(blob)
        onUploaded()
      }}
      onClose={onClose}
    />
  )
}
