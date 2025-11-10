# Pancake Roadmap

## React plugin outputs

- Short term we are shipping without `@truecms/pancake-react`. The plugin still targets the legacy bundler API and does not emit placeholder components under Node 22.
- Test fixtures for React scenarios now reflect the absence of React artefacts. Reinstating the plugin will require bringing the compiler up to date and wiring fresh fixtures.
- Track this item so we either port the plugin to the modern pipeline or formally retire the React expectations.

