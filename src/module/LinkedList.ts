import ListNode from "./ListNode";

export default class LinkedKList {
  head: ListNode;
  end: ListNode;

  constructor(head: ListNode) {
    this.head = head;
    this.end = head;
  }

  addNode(node: ListNode) {
    this.end.linkTo(node);
    this.end = node;
  }
}
