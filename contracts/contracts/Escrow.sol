// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Escrow {
    enum Status { None, Locked, Released, Refunded }

    struct Deal {
        address buyer;
        address seller;
        uint256 amount;
        uint256 deadline;
        Status status;
    }

    mapping(bytes32 => Deal) public deals; // orderId => deal

    event Locked(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline);
    event Released(bytes32 indexed orderId, address indexed seller, uint256 amount);
    event Refunded(bytes32 indexed orderId, address indexed buyer, uint256 amount);

    function lock(bytes32 orderId, address seller, uint256 deadline) external payable {
        require(seller != address(0), "seller");
        require(msg.value > 0, "amount");
        require(deadline > block.timestamp, "deadline");
        Deal storage d = deals[orderId];
        require(d.status == Status.None, "exists");
        d.buyer = msg.sender;
        d.seller = seller;
        d.amount = msg.value;
        d.deadline = deadline;
        d.status = Status.Locked;
        emit Locked(orderId, msg.sender, seller, msg.value, deadline);
    }

    function release(bytes32 orderId) external {
        Deal storage d = deals[orderId];
        require(d.status == Status.Locked, "not locked");
        require(msg.sender == d.buyer, "only buyer");
        d.status = Status.Released;
        (bool ok, ) = d.seller.call{value: d.amount}("");
        require(ok, "transfer fail");
        emit Released(orderId, d.seller, d.amount);
    }

    function refund(bytes32 orderId) external {
        Deal storage d = deals[orderId];
        require(d.status == Status.Locked, "not locked");
        require(block.timestamp >= d.deadline, "not due");
        d.status = Status.Refunded;
        (bool ok, ) = d.buyer.call{value: d.amount}("");
        require(ok, "refund fail");
        emit Refunded(orderId, d.buyer, d.amount);
    }
}
