import { Args, Mutation, Resolver } from "@nestjs/graphql";
import {
  Allow,
  Ctx,
  Order,
  OrderService,
  Permission,
  PluginCommonModule,
  RequestContext,
  Transaction,
  TransactionalConnection,
  UserInputError,
  VendurePlugin,
  isGraphQlErrorResult,
} from "@vendure/core";
import gql from "graphql-tag";

const CUSTOMER_CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

const shopApiExtensions = gql`
  extend type Mutation {
    cancelMyOrder(code: String!): Order!
  }
`;

@Resolver()
export class CancelMyOrderResolver {
  constructor(
    private connection: TransactionalConnection,
    private orderService: OrderService,
  ) {}

  @Transaction()
  @Mutation()
  @Allow(Permission.Owner)
  async cancelMyOrder(
    @Ctx() ctx: RequestContext,
    @Args("code") code: string,
  ): Promise<Order> {
    if (!ctx.activeUserId) {
      throw new UserInputError("You must be signed in to cancel an order.");
    }

    const order = await this.connection.getRepository(ctx, Order).findOne({
      where: { code },
      relations: ["customer", "customer.user"],
    });

    if (!order || order.customer?.user?.id !== ctx.activeUserId) {
      throw new UserInputError("Order not found.");
    }

    if (order.state === "Cancelled") {
      throw new UserInputError("This order has already been cancelled.");
    }

    const customFields = (order.customFields ?? {}) as Record<string, unknown>;
    const orderStatus = customFields.orderStatus;

    if (
      typeof orderStatus !== "string" ||
      !CUSTOMER_CANCELLABLE_STATUSES.includes(orderStatus)
    ) {
      throw new UserInputError("This order can no longer be cancelled.");
    }

    const result = await this.orderService.cancelOrder(ctx, {
      orderId: order.id,
      cancelShipping: true,
      reason: "Cancelled by customer",
    });

    if (isGraphQlErrorResult(result)) {
      throw new UserInputError(result.message);
    }

    return this.orderService.updateCustomFields(ctx, order.id, {
      ...customFields,
      orderStatus: "CANCELLED",
    });
  }
}

@VendurePlugin({
  imports: [PluginCommonModule],
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [CancelMyOrderResolver],
  },
  compatibility: "^3.0.0",
})
export class CancelMyOrderPlugin {}
