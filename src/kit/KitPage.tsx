import { KitGallery } from './KitGallery';

/** /kit: every component in every state, once per theme. Development only. */
export function KitPage() {
  return (
    <div className="oc-kit">
      <div className="oc oc--a oc-kit__theme" data-theme="a">
        <KitGallery themeName="Option A · Calm and clear" />
      </div>
      <div className="oc oc--b oc-kit__theme" data-theme="b">
        <KitGallery themeName="Option B · Clinic pass" />
      </div>
    </div>
  );
}
