const cards = document.querySelectorAll('.download-card');
const githubApi = 'https://api.github.com/repos/matejpcs';
const targetVersion = /(?:^|[^0-9])26\.2(?:[^0-9]|$)/i;
const neoJarName = /^netflared-neo-(1\.(?:20|21)(?:\.\d+)?|26\.\d+(?:\.\d+)?)\.jar$/i;
const neoReleaseGroups = [
  {
    tag: 'v1.3.9-neo-1.20',
    versions: ['1.20', '1.20.1', '1.20.2', '1.20.3', '1.20.4', '1.20.5', '1.20.6']
  },
  {
    tag: 'v1.3.9-neo-1.21',
    versions: ['1.21', '1.21.1', '1.21.2', '1.21.3', '1.21.4', '1.21.5', '1.21.6', '1.21.7', '1.21.8', '1.21.9', '1.21.10', '1.21.11']
  },
  {
    tag: 'v1.3.9-neo-26',
    versions: ['26.1', '26.1.1', '26.1.2', '26.2']
  }
];

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

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function enableNeoVersionPicker(card, releases) {
  const picker = card.querySelector('.neo-version-picker');
  const select = picker.querySelector('select');
  const versions = new Map();

  releases
    .filter((release) => !release.draft && !release.prerelease)
    .forEach((release) => {
      release.assets?.forEach((asset) => {
        const match = asset.name.match(neoJarName);
        if (match && !versions.has(match[1])) {
          versions.set(match[1], { release, asset });
        }
      });
    });

  if (!versions.size) {
    picker.hidden = true;
    return false;
  }

  const groups = new Map([
    ['1.20', document.createElement('optgroup')],
    ['1.21', document.createElement('optgroup')],
    ['26', document.createElement('optgroup')]
  ]);
  groups.get('1.20').label = 'Minecraft 1.20 line';
  groups.get('1.21').label = 'Minecraft 1.21 line';
  groups.get('26').label = 'Minecraft 26 line';

  [...versions.keys()].sort(compareVersions).forEach((version) => {
    const option = document.createElement('option');
    option.value = version;
    option.textContent = version;
    const group = version.startsWith('1.20') ? '1.20' : version.startsWith('1.21') ? '1.21' : '26';
    groups.get(group).append(option);
  });
  groups.forEach((group) => {
    if (group.children.length) select.append(group);
  });

  const selectedVersion = versions.has('26.2')
    ? '26.2'
    : [...versions.keys()].sort(compareVersions).at(-1);
  select.value = selectedVersion;
  picker.hidden = false;

  const updateDownload = () => {
    const version = select.value;
    const { release, asset } = versions.get(version);
    const link = card.querySelector('.download-link');
    const label = card.querySelector('.version-label');
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';

    card.classList.remove('download-unavailable');
    delete card.dataset.unavailable;
    card.querySelector('.release-status').classList.add('is-live');
    label.textContent = `${release.tag_name} · Minecraft ${version}`;
    link.href = asset.browser_download_url;
    link.removeAttribute('aria-disabled');
    link.replaceChildren(document.createTextNode(`Download ${version} `), arrow);
  };

  select.addEventListener('change', updateDownload);
  updateDownload();
  return true;
}

function fallbackNeoReleases() {
  return neoReleaseGroups.map(({ tag, versions }) => ({
    tag_name: tag,
    draft: false,
    prerelease: false,
    assets: versions.map((version) => ({
      name: `netflared-neo-${version}.jar`,
      browser_download_url: `https://github.com/matejpcs/netflared-neo/releases/download/${tag}/netflared-neo-${version}.jar`
    }))
  }));
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
    if (repo === 'netflared-neo') {
      if (!enableNeoVersionPicker(card, releases)) {
        enableNeoVersionPicker(card, fallbackNeoReleases());
      }
      return;
    }

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
    if (repo === 'netflared-neo') {
      enableNeoVersionPicker(card, fallbackNeoReleases());
    } else {
      disableCard(card, 'Release check unavailable');
    }
  }
});
