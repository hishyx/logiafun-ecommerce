const transitions = {
  pending: ["processing", "cancelled"],

  processing: ["shipped", "cancelled"],

  shipped: ["in_transit"],

  in_transit: ["delivered"],

  delivered: ["returned"],

  cancelled: [],

  returned: [],
};

export default transitions;
