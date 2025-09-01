import * as XLSX from 'xlsx';
import { db } from '@/db';
import { 
  products, 
  productVariants, 
  customerPricing, 
  priceUpdateHistory,
  supportTickets,
  chatInteractions,
  orders,
  orderItems
} from '@/db/schema';
import { eq, and, or, isNull, gt } from 'drizzle-orm';

// Interface for Excel price update
interface PriceUpdateRow {
  sku: string;
  price: number;
  productName?: string;
  variantName?: string;
}

// Interface for price update result
interface PriceUpdateResult {
  success: boolean;
  totalRows: number;
  successfulUpdates: number;
  failedUpdates: number;
  errors: Array<{
    row: number;
    sku: string;
    error: string;
  }>;
  updates: Array<{
    productId: string;
    variantId?: string;
    sku: string;
    oldPrice: number;
    newPrice: number;
  }>;
}

// Excel file processing utility
export class PriceUpdateService {
  
  /**
   * Process Excel file for price updates
   */
  static async processExcelFile(
    file: Buffer,
    customerEmail: string,
    uploadedBy: string
  ): Promise<PriceUpdateResult> {
    try {
      const workbook = XLSX.read(file, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data: PriceUpdateRow[] = XLSX.utils.sheet_to_json(worksheet);
      
      const result: PriceUpdateResult = {
        success: true,
        totalRows: data.length,
        successfulUpdates: 0,
        failedUpdates: 0,
        errors: [],
        updates: []
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel rows start from 1, and first row is header
        
        try {
          // Validate required fields
          if (!row.sku || !row.price) {
            result.errors.push({
              row: rowNumber,
              sku: row.sku || 'N/A',
              error: 'Missing SKU or price'
            });
            result.failedUpdates++;
            continue;
          }

          // Find product by SKU
          const product = await this.findProductBySKU(row.sku);
          if (!product) {
            result.errors.push({
              row: rowNumber,
              sku: row.sku,
              error: 'Product not found'
            });
            result.failedUpdates++;
            continue;
          }

          // Update or create customer pricing
          const updateResult = await this.updateCustomerPricing({
            customerEmail,
            productId: product.id,
            variantId: product.variantId,
            sku: row.sku,
            newPrice: row.price,
            uploadedBy
          });

          if (updateResult.success) {
            result.updates.push({
              productId: product.id,
              variantId: product.variantId,
              sku: row.sku,
              oldPrice: updateResult.oldPrice,
              newPrice: row.price
            });
            result.successfulUpdates++;
          } else {
            result.errors.push({
              row: rowNumber,
              sku: row.sku,
              error: updateResult.error || 'Unknown error'
            });
            result.failedUpdates++;
          }

        } catch (error) {
          result.errors.push({
            row: rowNumber,
            sku: row.sku || 'N/A',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          result.failedUpdates++;
        }
      }

      // Save update history
      await this.saveUpdateHistory({
        customerEmail,
        fileName: 'uploaded-file.xlsx',
        result,
        uploadedBy
      });

      return result;

    } catch (error) {
      throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find product by SKU
   */
  private static async findProductBySKU(sku: string): Promise<{
    id: string;
    variantId?: string;
    basePrice: number;
  } | null> {
    try {
      // First check if it's a product SKU
      const product = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
      if (product.length > 0) {
        return {
          id: product[0].id,
          basePrice: parseFloat(product[0].basePrice)
        };
      }

      // Then check if it's a variant SKU
      const variant = await db.select({
        productId: productVariants.productId,
        variantId: productVariants.id,
        basePrice: products.basePrice,
        priceAdjustment: productVariants.priceAdjustment
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(eq(productVariants.sku, sku))
      .limit(1);

      if (variant.length > 0) {
        return {
          id: variant[0].productId,
          variantId: variant[0].variantId,
          basePrice: parseFloat(variant[0].basePrice) + parseFloat(variant[0].priceAdjustment)
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding product by SKU:', error);
      return null;
    }
  }

  /**
   * Update customer pricing
   */
  private static async updateCustomerPricing(params: {
    customerEmail: string;
    productId: string;
    variantId?: string;
    sku: string;
    newPrice: number;
    uploadedBy: string;
  }): Promise<{ success: boolean; oldPrice: number; error?: string }> {
    try {
      // Check if customer pricing already exists
      const existingPricing = await db.select()
        .from(customerPricing)
        .where(
          and(
            eq(customerPricing.customerEmail, params.customerEmail),
            eq(customerPricing.productId, params.productId),
            params.variantId ? eq(customerPricing.variantId, params.variantId) : isNull(customerPricing.variantId)
          )
        )
        .limit(1);

      let oldPrice = 0;

      if (existingPricing.length > 0) {
        // Update existing pricing
        oldPrice = parseFloat(existingPricing[0].customPrice);
        await db.update(customerPricing)
          .set({
            customPrice: params.newPrice.toString(),
            updatedAt: new Date(),
            isActive: true
          })
          .where(eq(customerPricing.id, existingPricing[0].id));
      } else {
        // Create new customer pricing
        // Get base price from product
        const product = await db.select()
          .from(products)
          .where(eq(products.id, params.productId))
          .limit(1);

        if (product.length === 0) {
          return { success: false, oldPrice: 0, error: 'Product not found' };
        }

        oldPrice = parseFloat(product[0].basePrice);

        // If variant exists, add variant price adjustment
        if (params.variantId) {
          const variant = await db.select()
            .from(productVariants)
            .where(eq(productVariants.id, params.variantId))
            .limit(1);

          if (variant.length > 0) {
            oldPrice += parseFloat(variant[0].priceAdjustment);
          }
        }

        await db.insert(customerPricing).values({
          customerEmail: params.customerEmail,
          productId: params.productId,
          variantId: params.variantId,
          customPrice: params.newPrice.toString(),
          isActive: true,
          validFrom: new Date(),
          createdBy: params.uploadedBy,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return { success: true, oldPrice };

    } catch (error) {
      console.error('Error updating customer pricing:', error);
      return { 
        success: false, 
        oldPrice: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save update history
   */
  private static async saveUpdateHistory(params: {
    customerEmail: string;
    fileName: string;
    result: PriceUpdateResult;
    uploadedBy: string;
  }) {
    try {
      const updateDetails = [
        ...params.result.updates.map(update => ({
          productId: update.productId,
          sku: update.sku,
          oldPrice: update.oldPrice,
          newPrice: update.newPrice,
          status: 'success' as const
        })),
        ...params.result.errors.map(error => ({
          productId: '',
          sku: error.sku,
          oldPrice: 0,
          newPrice: 0,
          status: 'failed' as const,
          error: error.error
        }))
      ];

      await db.insert(priceUpdateHistory).values({
        customerEmail: params.customerEmail,
        fileName: params.fileName,
        totalProducts: params.result.totalRows,
        successfulUpdates: params.result.successfulUpdates,
        failedUpdates: params.result.failedUpdates,
        updateDetails,
        uploadedBy: params.uploadedBy,
        createdAt: new Date()
      });

    } catch (error) {
      console.error('Error saving update history:', error);
    }
  }

  /**
   * Get customer-specific price for a product
   */
  static async getCustomerPrice(
    customerEmail: string,
    productId: string,
    variantId?: string
  ): Promise<number | null> {
    try {
      const pricing = await db.select()
        .from(customerPricing)
        .where(
          and(
            eq(customerPricing.customerEmail, customerEmail),
            eq(customerPricing.productId, productId),
            eq(customerPricing.isActive, true),
            variantId ? eq(customerPricing.variantId, variantId) : isNull(customerPricing.variantId),
            or(
              isNull(customerPricing.validUntil),
              gt(customerPricing.validUntil, new Date())
            )
          )
        )
        .limit(1);

      if (pricing.length > 0) {
        return parseFloat(pricing[0].customPrice);
      }

      return null; // No custom pricing found, use base price

    } catch (error) {
      console.error('Error getting customer price:', error);
      return null;
    }
  }

  /**
   * Get effective price (custom or base price)
   */
  static async getEffectivePrice(
    customerEmail: string,
    productId: string,
    variantId?: string
  ): Promise<number> {
    try {
      // First try to get customer-specific price
      const customPrice = await this.getCustomerPrice(customerEmail, productId, variantId);
      if (customPrice !== null) {
        return customPrice;
      }

      // Fall back to base price + variant adjustment
      const productQuery = db.select({
        basePrice: products.basePrice,
        priceAdjustment: productVariants.priceAdjustment
      })
      .from(products)
      .where(eq(products.id, productId));

      if (variantId) {
        productQuery.leftJoin(
          productVariants,
          and(
            eq(productVariants.productId, products.id),
            eq(productVariants.id, variantId)
          )
        );
      }

      const result = await productQuery.limit(1);

      if (result.length === 0) {
        throw new Error('Product not found');
      }

      let price = parseFloat(result[0].basePrice);
      if (result[0].priceAdjustment) {
        price += parseFloat(result[0].priceAdjustment);
      }

      return price;

    } catch (error) {
      console.error('Error getting effective price:', error);
      throw error;
    }
  }
}

// Support ticket service for chatbot escalation
export class SupportService {
  
  /**
   * Escalate chat interaction to support ticket
   */
  static async escalateChatToSupport(params: {
    chatInteractionId: string;
    customerEmail: string;
    customerName?: string;
    subject: string;
    description: string;
    chatHistory: Array<{
      role: 'user' | 'bot';
      message: string;
      timestamp: Date;
    }>;
  }): Promise<string> {
    try {
      // Generate ticket number
      const ticketNumber = await this.generateTicketNumber();

      // Create support ticket
      const ticketId = crypto.randomUUID();
      await db.insert(supportTickets).values({
        id: ticketId,
        ticketNumber,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        subject: params.subject,
        description: params.description,
        priority: 'medium',
        status: 'open',
        source: 'chatbot',
        chatConversation: params.chatHistory.map(msg => ({
          role: msg.role,
          message: msg.message,
          timestamp: msg.timestamp.toISOString()
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update chat interaction to mark as escalated
      await db.update(chatInteractions)
        .set({
          escalatedToSupport: true,
          supportTicketId: ticketId,
          updatedAt: new Date()
        })
        .where(eq(chatInteractions.id, params.chatInteractionId));

      return ticketNumber;

    } catch (error) {
      console.error('Error escalating chat to support:', error);
      throw error;
    }
  }

  /**
   * Generate unique ticket number
   */
  private static async generateTicketNumber(): Promise<string> {
    const prefix = 'TKT';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

// Order management service
export class OrderService {
  
  /**
   * Create order from cart items
   */
  static async createOrder(params: {
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    customerAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    cartItems: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }>;
    notes?: string;
  }): Promise<string> {
    try {
      const orderNumber = await this.generateOrderNumber();
      const orderId = crypto.randomUUID();

      // Calculate order total and prepare order items
      let totalAmount = 0;
      const orderItemsData: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        productSnapshot: {
          name: string;
          sku: string;
          specifications: Record<string, any>;
        };
      }> = [];

      for (const cartItem of params.cartItems) {
        // Get effective price for customer
        const unitPrice = await PriceUpdateService.getEffectivePrice(
          params.customerEmail,
          cartItem.productId,
          cartItem.variantId
        );

        // Get product details for snapshot
        const product = await db.select({
          name: products.name,
          sku: products.sku,
          specifications: products.specifications
        })
        .from(products)
        .where(eq(products.id, cartItem.productId))
        .limit(1);

        if (product.length === 0) {
          throw new Error(`Product ${cartItem.productId} not found`);
        }

        const itemTotal = unitPrice * cartItem.quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity,
          unitPrice,
          totalPrice: itemTotal,
          productSnapshot: {
            name: product[0].name,
            sku: product[0].sku,
            specifications: product[0].specifications as Record<string, any>
          }
        });
      }

      // Create order
      await db.insert(orders).values({
        id: orderId,
        orderNumber,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerAddress: params.customerAddress,
        status: 'pending',
        totalAmount: totalAmount.toString(),
        notes: params.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create order items
      for (const item of orderItemsData) {
        await db.insert(orderItems).values({
          id: crypto.randomUUID(),
          orderId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          productSnapshot: item.productSnapshot,
          createdAt: new Date()
        });
      }

      return orderNumber;

    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Generate unique order number
   */
  private static async generateOrderNumber(): Promise<string> {
    const prefix = 'ORD';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    
    return `${prefix}-${year}${month}${day}-${timestamp}`;
  }
}