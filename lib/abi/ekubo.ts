export const ekuboRouterABI = [
  {
    "name": "swap",
    "type": "function",
    "inputs": [
      { "name": "token_in", "type": "felt" },
      { "name": "token_out", "type": "felt" },
      { "name": "amount_in", "type": "felt" },
      { "name": "min_amount_out", "type": "felt" }
    ],
    "outputs": [
      { "name": "amount_out", "type": "felt" }
    ]
  },
  {
    "name": "get_amounts_out",
    "type": "function",
    "inputs": [
      { "name": "token_in", "type": "felt" },
      { "name": "token_out", "type": "felt" },
      { "name": "amount_in", "type": "felt" }
    ],
    "outputs": [
      { "name": "amount_out", "type": "felt" },
      { "name": "price_impact", "type": "felt" }
    ]
  }
];

export const ekuboPoolABI = [
  {
    "name": "get_reserves",
    "type": "function",
    "inputs": [],
    "outputs": [
      { "name": "reserve0", "type": "felt" },
      { "name": "reserve1", "type": "felt" }
    ]
  },
  {
    "name": "get_fee",
    "type": "function",
    "inputs": [],
    "outputs": [
      { "name": "fee", "type": "felt" }
    ]
  },
  {
    "name": "get_tokens",
    "type": "function",
    "inputs": [],
    "outputs": [
      { "name": "token0", "type": "felt" },
      { "name": "token1", "type": "felt" }
    ]
  }
];
