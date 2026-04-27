function AuthLoading() {
  return (
    <main className="auth-loading" aria-live="polite" aria-busy="true">
      <div className="auth-spinner" />
      <p>Checking your session...</p>
    </main>
  );
}

export default AuthLoading;

