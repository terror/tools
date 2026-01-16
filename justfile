set dotenv-load

export EDITOR := 'nvim'

default:
  just --list

ci: fmt-check lint build

[group: 'dev']
build:
  bun run build

[group: 'dev']
dev:
  bun run dev

[group: 'format']
fmt:
  prettier --write .

[group: 'check']
fmt-check:
  bun run format-check

[group: 'check']
lint:
  bun run lint
