import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../i18n';

interface CameraViewProps {
  /** A live camera stream, already granted by the browser. This view stops it when it closes. */
  stream: MediaStream;
  /** For example "Front of the card". */
  title: string;
  /** Called with the photo, as a JPEG data URL, once the person presses "Use this photo". */
  onPhoto: (dataUrl: string) => void;
  onCancel: () => void;
  /** "Upload instead": the person would rather pick a file. */
  onUpload: () => void;
}

/**
 * The in-page camera (SPEC 5.4): the live view with a frame for the card and a shutter,
 * then the photo to check with "Retake" and "Use this photo". Covers the screen.
 */
export function CameraView({ stream, title, onPhoto, onCancel, onUpload }: CameraViewProps) {
  const { t } = useI18n();
  const video = useRef<HTMLVideoElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.srcObject = stream;
    // Autoplay can be refused; the shutter still works on the first frame once it plays.
    void Promise.resolve(element.play?.()).catch(() => undefined);
  }, [stream, photo]);

  // Whenever this view closes, for any reason, the camera is turned off.
  useEffect(() => () => stream.getTracks().forEach((track) => track.stop()), [stream]);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  const takePhoto = () => {
    const element = video.current;
    if (!element) return;
    const canvas = document.createElement('canvas');
    canvas.width = element.videoWidth || 1280;
    canvas.height = element.videoHeight || 720;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(element, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.9));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
    }
  };

  return (
    // The dialog listens for Escape; its controls are real buttons.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div className="oc-camera" role="dialog" aria-modal="true" aria-label={title} onKeyDown={onKeyDown}>
      {photo ? (
        <img className="oc-camera__video oc-camera__video--photo" src={photo} alt={t('camera.photoAlt')} />
      ) : (
        <video className="oc-camera__video" ref={video} autoPlay playsInline muted aria-label={t('camera.view')} />
      )}
      <div className="oc-camera__top">
        <h1 className="oc-camera__title" tabIndex={-1} ref={heading}>
          {title}
        </h1>
        <p className="oc-camera__text">{photo ? t('camera.reviewText') : t('camera.text')}</p>
      </div>
      {photo ? null : <div className="oc-camera__frame" aria-hidden="true" />}
      {photo ? (
        <div className="oc-camera__bar">
          <button type="button" className="oc-camera__btn" onClick={() => setPhoto(null)}>
            {t('camera.retake')}
          </button>
          <button type="button" className="oc-btn oc-btn--primary" onClick={() => onPhoto(photo)}>
            {t('camera.use')}
          </button>
        </div>
      ) : (
        <div className="oc-camera__bar">
          <button type="button" className="oc-camera__btn" onClick={onCancel}>
            {t('camera.cancel')}
          </button>
          <button type="button" className="oc-shutter" aria-label={t('camera.take')} onClick={takePhoto} />
          <button type="button" className="oc-camera__btn" onClick={onUpload}>
            {t('camera.uploadInstead')}
          </button>
        </div>
      )}
    </div>
  );
}
