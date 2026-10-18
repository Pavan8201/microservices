# VanBank frontend

Angular pages for the accounts, cards, and loans services. Each page follows that service's create, fetch, update, and delete operations.

## Run

Start the accounts service on port 8080, cards on 9000, and loans on 8090. Then:

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200/`. The dev server proxies:

| Browser path | Service |
| --- | --- |
| `/accounts-api` | `http://localhost:8080` |
| `/cards-api` | `http://localhost:9000` |
| `/loans-api` | `http://localhost:8090` |

## Checks

```bash
npm test
npm run build
```
