import { BaseEntity } from './index';

export interface OrderFeedback extends BaseEntity {
  order_id: string;
  customer_id: string;
  delivery_rating: number;
  service_rating: number;
  comment: string;
  order_details?: {
    order_display_no?: string;
  };
  customer_details?: {
    name?: string;
    mobile?: string;
  };
}

export interface FeedbackListData {
  totalFeedback: number;
  total_pages: number;
  currentPage: number;
  feedbackList: OrderFeedback[];
}

export interface FeedbackDetailsData {
  feedback: OrderFeedback;
}
