"use strict";
const stripe = require("stripe")('sk_test_51NoEb9JHYEbXwkcVzYMZdy5CyVvNqnWHQhcIjpdZmhaKvtv1Nkxcc94Pio1UPwKImGfYtSvkcstIH2e1ZRbJAXnQ00YWPOM7LZ');

function calcDiscountPrice(price, discount) {
  if (!discount) return price;
  const discountAmount = (price * discount) / 100;
  const result = price - discountAmount;
  return result.toFixed(2);
}

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async paymentOrder(ctx) {

    console.log(ctx.request.body)
    const { token, products, idUser, addressShipping } = ctx.request.body;
    let totalPayment = 0;
    products.forEach((product) => {
      const priceTemp = calcDiscountPrice(
        product.attributes.price,
        product.attributes.discount
      );
      totalPayment += Number(priceTemp) * product.quantity;
    });
    const charge = await stripe.charges.create({
        amount: Math.round(totalPayment * 100),
        currency: 'usd',
        source: token.id,
        description: `ID User: ${idUser}`,
    });
    const data = {
        products,
        user: idUser,
        totalPayment,
        addressShipping,
        idPayment: charge.id,
    };
console.log(data)
    const model = strapi.contentTypes["api::order.order"];
    const validData = await strapi.entityValidator.validateEntityCreation(
        model,
        data
    );
    const entry = await strapi.db.query("api::order.order").create({data: validData});
    return entry;
  },
}));
