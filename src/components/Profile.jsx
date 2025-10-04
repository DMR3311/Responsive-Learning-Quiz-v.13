export function Profile({ user, onSignOut }) {
  if (user?.isGuest) {
    return (
      <div className="profile-widget">
        <div className="profile-info">
          <span className="profile-name">Guest User</span>
        </div>
        <button className="btn btn-small" onClick={onSignOut}>
          Exit
        </button>
      </div>
    );
  }

  return (
    <div className="profile-widget">
      <div className="profile-info">
        <span className="profile-name">{user?.name || user?.email || 'User'}</span>
      </div>
      <button className="btn btn-small" onClick={onSignOut}>
        Sign Out
      </button>
    </div>
  );
}
