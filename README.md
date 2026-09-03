# bundle

This branch contains **generated output only**.

Do not hand-edit files here — everything in this branch is produced by
[`scripts/build-bundle.mjs`](https://github.com/reysamonte/ai-sdlc-day1/blob/main/scripts/build-bundle.mjs)
on the `main` branch of this repository, which assembles the backend, the
built frontend, and the CLI into a single deployable unit.

To regenerate this branch, run the build script from the `main` checkout
(with submodules initialized):

```sh
node scripts/build-bundle.mjs --push
```
