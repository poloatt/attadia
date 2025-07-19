import React, { useMemo } from 'react';
import { formatearFecha } from './utils/historialUtils';

const HabitProgress = ({ section, itemId, historial, config }) => {
  // Memorizar datos de progreso
  const progressData = useMemo(() => {
    if (!historial) return null;

    const { completados = [], diasConsecutivos = 0, progreso = 0 } = historial;
    const porcentaje = Math.round(progreso * 100);

    return {
      completados,
      diasConsecutivos,
      porcentaje,
      ultimaCompletacion: completados[0]
    };
  }, [historial]);

  if (!progressData) return null;

  const { completados, diasConsecutivos, porcentaje, ultimaCompletacion } = progressData;

  return (
    <div className="habit-progress">
      <div className="habit-progress__header">
        <span className="habit-progress__type">
          {config.tipo === 'DIARIO' ? '📅' : 
           config.tipo === 'SEMANAL' ? '📅' : '📅'}
          {config.tipo.toLowerCase()}
        </span>
        <span className="habit-progress__stats">
          {diasConsecutivos > 1 && (
            <span className="habit-progress__streak">
              🔥 {diasConsecutivos} días
            </span>
          )}
          <span className="habit-progress__count">
            {completados.length} completados
          </span>
        </span>
      </div>
      
      <div className="habit-progress__bar">
        <div 
          className="habit-progress__fill"
          style={{ width: `${porcentaje}%` }}
        />
        <span className="habit-progress__text">
          {porcentaje}%
        </span>
      </div>

      {ultimaCompletacion && (
        <div className="habit-progress__last">
          Última vez: {formatearFecha(ultimaCompletacion)}
        </div>
      )}

      <style jsx>{`
        .habit-progress {
          padding: 0.5rem;
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          margin-top: 0.5rem;
        }

        .habit-progress__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .habit-progress__type {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-secondary);
        }

        .habit-progress__stats {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-tertiary);
        }

        .habit-progress__streak {
          color: var(--text-accent);
          font-weight: 500;
        }

        .habit-progress__bar {
          height: 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 0.25rem;
          position: relative;
          overflow: hidden;
        }

        .habit-progress__fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--primary);
          transition: width 0.3s ease;
        }

        .habit-progress__text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.75rem;
          color: var(--text-primary);
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .habit-progress__last {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default HabitProgress; 
