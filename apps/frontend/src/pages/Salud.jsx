import React from 'react';
import { Navigate } from 'react-router-dom';

export function Salud() {
  return <Navigate to="/salud/datacorporal" replace />;
}

export default Salud; 