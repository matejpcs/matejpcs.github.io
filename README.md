# Netflared website

A static, GitHub Pages compatible landing page for the Netflared project family.

## Publish

Place these files at the root of `matejpcs/matejpcs.github.io` and enable GitHub Pages from the repository's main branch and root folder. No build step is required.

The downloads section checks GitHub's public Releases API and enables a button only when it finds a Minecraft 26.2 JAR. It chooses the 26.2 artifact from each repository's release list, so older compatibility releases such as 1.20.x, 1.21.x, and 26.1.x are never selected. The Paper server workflow publishes separate compatibility releases; the page selects the JAR named for 26.2 from the 26.x release.
