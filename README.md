# CallCollins

## Secrets

`ANTHROPIC_API_KEY` is a Cursor Cloud Agent Runtime Secret. Agents receive it as the `ANTHROPIC_API_KEY` environment variable when they start. Do not commit the key, and do not put it in `.env` files or `environment.json`.

Add it in either place:

- Personal secrets on the [Cloud Agents dashboard](https://cursor.com/dashboard/cloud-agents): name `ANTHROPIC_API_KEY`, type Runtime Secret, applied to this repository.
- This environment’s secrets: [c5558ce1-c711-11f1-ac31-5e2d0494121f](https://cursor.com/dashboard/cloud-agents/environments/e/c5558ce1-c711-11f1-ac31-5e2d0494121f). Secrets saved here only reach agents that use this environment.

The key is saved. Confirm it is present without printing the value:

```bash
test -n "$ANTHROPIC_API_KEY" && echo set
```

Verified October 28, 2026 (Eastern Time): the variable is set, and `GET https://api.anthropic.com/v1/models` with that key returns HTTP 200. A new agent picks up secrets saved after it started.
