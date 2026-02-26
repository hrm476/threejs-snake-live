import { SnakeNode } from "./Snake";

export default class ListNode {
  next: ListNode | null = null;
  prev: ListNode | null = null;
  data: SnakeNode;

  constructor(data: SnakeNode) {
    this.data = data;
  }

  linkTo(node: ListNode) {
    this.next = node;
    node.prev = this;
  }
}
