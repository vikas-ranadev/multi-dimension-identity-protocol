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

```bash
git clone -b dev https://gitlab.com/ranadev/multi-dimension-identity-protocol.git
npm install
cd multi-dimension-identity-protocol/bin
./mdip
```
