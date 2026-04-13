export default async function protectPage() {
  const isLoggedIn = await window.api.checkAuthStatus();
  if (!isLoggedIn) {
    window.location.href = '../login/index.html';
  }
}