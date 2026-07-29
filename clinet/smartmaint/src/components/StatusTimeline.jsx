const statusSteps = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const getStepState = (currentStatus, stepIndex) => {
  const currentIndex = statusSteps.findIndex((step) => step.key === currentStatus);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
};

export default function StatusTimeline({ currentStatus }) {
  const accentColor = '#0B2818';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
      {statusSteps.map((step, index) => {
        const state = getStepState(currentStatus, index);
        const isCompleted = state === 'completed';
        const isCurrent = state === 'current';
        const circleColor = isCurrent ? accentColor : isCompleted ? '#111111' : '#D1D5DB';
        const lineColor = index < statusSteps.length - 1
          ? getStepState(currentStatus, index + 1) === 'upcoming'
            ? '#E5E7EB'
            : accentColor
          : 'transparent';

        return (
          <div
            key={step.key}
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: circleColor,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  zIndex: 1,
                }}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: isCurrent || isCompleted ? '#111111' : '#6B7280',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {step.label}
              </span>
            </div>

            {index < statusSteps.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  height: 3,
                  backgroundColor: lineColor,
                  left: '50%',
                  right: '-50%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
