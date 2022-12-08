const network = exports;

/**
 * Types of Networks provided
 */
network.types = ['main', 'testnet'];

/**
 * Mainnet Configuration
 */
const mainnet = {};

mainnet.type = 'main';

/**
 * Mainnet Port
 */
mainnet.port = 7444;

/**
 * Mainnet API Port
 */
mainnet.apiPort = process.env.PORT || 7445;

/**
 * Testnet Configuration
 */
const tesnet = {};

/**
 * Explicitly specifying network type
 */
tesnet.type = 'testnet';

/**
 * Testnet Port
 */
tesnet.port = 17444;

/**
 * Testnet API Port
 */
tesnet.apiPort = 17445;

network.mainnet = mainnet;
network.tesnet = tesnet;
