## MDIP

Multi Dimension Identity Protocol

### Requirements

- Node 12.x
- Npm 6.x
- Bitcoin Node with tx-index enabled

### Configuration File(bin/etc/local.conf)

```bash
# MDIP config
[mdip]

# Additional Dependencies
[deps]
url=http://localhost:18332
username=<bitcoin-username>
password=<bitcoin-password>
```

### Running MDIP Daemon

#### Running from source

```bash
git clone -b dev https://github.com/KeychainMDIP/multi-dimension-identity-protocol.git
npm install
cd multi-dimension-identity-protocol/bin
./mdip
```

#### Running in Docker

```bash
docker compose up
```

#### Testing MDIP is running

```bash
curl http://localhost:7445/getuptime
curl http://localhost:7445/serverinfo
```
