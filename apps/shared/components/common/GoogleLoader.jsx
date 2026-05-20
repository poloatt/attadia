import React from 'react';

/** Classic four-color Google-style dot loader (CSS in @shared/index.css). */
export default function GoogleLoader() {
  return (
    <div className="google-loader" aria-hidden="true">
      <span className="google-loader__dot google-loader__dot--blue" />
      <span className="google-loader__dot google-loader__dot--red" />
      <span className="google-loader__dot google-loader__dot--yellow" />
      <span className="google-loader__dot google-loader__dot--green" />
    </div>
  );
}
