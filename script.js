const cards = document.querySelectorAll('.download-card');
const githubApi = 'https://api.github.com/repos/matejpcs';
const targetVersion = /(?:^|[^0-9])26\.2(?:[^0-9]|$)/i;

document.querySelector('#year').textContent = new Date().getFullYear();

function disableCard(card, message) {
  const link = card.querySelector('.download-link');
  const label = card.querySelector('.version-label');
  card.classList.add('download-unavailable');
  card.dataset.unavailable = message;
  label.textContent = message;
  link.removeAttribute('href');
  link.setAttribute('aria-disabled', 'true');
  link.textContent = 'Unavailable';
}

function enableCard(card, release, asset) {
  const link = card.querySelector('.download-link');
  const label = card.querySelector('.version-label');
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  label.textContent = `${release.tag_name} · Minecraft 26.2`;
  card.classList.remove('download-unavailable');
  delete card.dataset.unavailable;
  link.href = asset.browser_download_url;
  link.removeAttribute('aria-disabled');
  link.replaceChildren(document.createTextNode('Download 26.2 '), arrow);
}

cards.forEach(async (card) => {
  const link = card.querySelector('.download-link');
  const repo = new URL(link.href).pathname.split('/')[2];
  link.removeAttribute('href');
  link.setAttribute('aria-disabled', 'true');
  link.textContent = 'Checking 26.2…';
  card.querySelector('.version-label').textContent = 'Looking for Minecraft 26.2';

  try {
    const response = await fetch(`${githubApi}/${repo}/releases?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const releases = await response.json();
    const match = releases
      .filter((release) => !release.draft && !release.prerelease)
      .map((release) => ({
        release,
        asset: release.assets?.find((item) =>
          item.name.toLowerCase().endsWith('.jar') &&
          !item.name.toLowerCase().endsWith('-sources.jar') &&
          targetVersion.test(item.name)
        )
      }))
      .find((item) => item.asset);

    if (!match) {
      disableCard(card, releases.length ? 'No 26.2 release' : 'No releases yet');
      return;
    }
    enableCard(card, match.release, match.asset);
  } catch {
    disableCard(card, 'Release check unavailable');
  }
});