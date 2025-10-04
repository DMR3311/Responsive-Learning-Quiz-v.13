export function ProgressPreview() {
  const unlockables = [
    {
      icon: '🎯',
      title: 'Cognitive Profile',
      description: 'Detailed analysis across 6 domains'
    },
    {
      icon: '📊',
      title: 'Performance Insights',
      description: 'Visual charts and comparisons'
    },
    {
      icon: '💡',
      title: 'Personalised Tips',
      description: 'Custom recommendations for growth'
    },
    {
      icon: '🏆',
      title: 'Achievement Badges',
      description: 'Unlock as you progress'
    }
  ];

  return (
    <div className="progress-preview">
      <h3 className="preview-title">What You'll Unlock</h3>
      <div className="unlockables-grid">
        {unlockables.map((item, index) => (
          <div key={index} className="unlockable-item" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="unlockable-icon">{item.icon}</div>
            <div className="unlockable-content">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
