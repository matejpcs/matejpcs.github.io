const neoCard = document.querySelector('#neo-client-download');

document.querySelector('#year').textContent = new Date().getFullYear();

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

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function enableNeoVersionPicker(card) {
  const picker = card.querySelector('.neo-version-picker');
  const select = picker.querySelector('select');
  const versions = new Map();

  neoReleaseGroups.forEach(({ tag, versions: groupVersions }) => {
    groupVersions.forEach((version) => {
      versions.set(version, {
        tag,
        url: `https://github.com/matejpcs/netflared-neo/releases/download/${tag}/netflared-neo-${version}.jar`
      });
    });
  });

  const groups = new Map([
    ['1.20', document.createElement('optgroup')],
    ['1.21', document.createElement('optgroup')],
    ['26', document.createElement('optgroup')]
  ]);
  groups.get('1.20').label = 'Minecraft 1.20';
  groups.get('1.21').label = 'Minecraft 1.21';
  groups.get('26').label = 'Minecraft 26';

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

  select.value = '26.2';
  picker.hidden = false;

  const updateDownload = () => {
    const version = select.value;
    const release = versions.get(version);
    const link = card.querySelector('.download-link');
    const label = card.querySelector('.version-label');
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';

    card.classList.remove('download-unavailable');
    delete card.dataset.unavailable;
    card.querySelector('.release-status').classList.add('is-live');
    label.textContent = `${release.tag} · Minecraft ${version}`;
    link.href = release.url;
    link.removeAttribute('aria-disabled');
    link.replaceChildren(document.createTextNode(`Download ${version} `), arrow);
  };

  select.addEventListener('change', updateDownload);
  updateDownload();
}

if (neoCard) enableNeoVersionPicker(neoCard);
