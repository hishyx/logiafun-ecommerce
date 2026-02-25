const transitions = {
  pending: ["processing", "cancelled"],

  processing: ["shipped", "cancelled"],

  shipped: ["in_transit", "returned"],

  in_transit: ["delivered", "returned"],

  delivered: ["returned"],

  cancelled: [],

  returned: [],
};

export default transitions;
