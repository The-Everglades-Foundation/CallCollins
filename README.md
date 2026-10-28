# CallCollins

## Secrets

`ANTHROPIC_API_KEY` is a Cursor Cloud Agent Runtime Secret. Agents receive it as the `ANTHROPIC_API_KEY` environment variable when they start. Do not commit the key, and do not put it in `.env` files or `environment.json`.

Add it in either place:

- Personal secrets on the [Cloud Agents dashboard](https://cursor.com/dashboard/cloud-agents): name `ANTHROPIC_API_KEY`, type Runtime Secret, applied to this repository.
- This environment’s secrets: [c5558ce1-c711-11f1-ac31-5e2d0494121f](https://cursor.com/dashboard/cloud-agents/environments/e/c5558ce1-c711-11f1-ac31-5e2d0494121f). Secrets saved here only reach agents that use this environment.

After saving, start a new agent. Confirm the variable is present without printing its value:

```bash
test -n "$ANTHROPIC_API_KEY" && echo set
```
