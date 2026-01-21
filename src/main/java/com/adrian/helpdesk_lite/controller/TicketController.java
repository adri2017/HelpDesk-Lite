package com.adrian.helpdesk_lite.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.adrian.helpdesk_lite.dto.CreateCommentRequest;
import com.adrian.helpdesk_lite.dto.CreateTicketRequest;
import com.adrian.helpdesk_lite.dto.UpdateStatusRequest;
import com.adrian.helpdesk_lite.model.Ticket;
import com.adrian.helpdesk_lite.model.TicketComment;
import com.adrian.helpdesk_lite.model.TicketStatus;
import com.adrian.helpdesk_lite.service.CommentService;
import com.adrian.helpdesk_lite.service.TicketService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*") // para front simple
public class TicketController {

    private final TicketService ticketService;
    private final CommentService commentService;

    public TicketController(TicketService ticketService, CommentService commentService) {
        this.ticketService = ticketService;
        this.commentService = commentService;
    }

    @GetMapping
    public List<Ticket> list(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) String q
    ) {
        return ticketService.list(status, q);
    }

    @GetMapping("/{id}")
    public Ticket get(@PathVariable Long id) {
        return ticketService.get(id);
    }

    @PostMapping
    public Ticket create(@Valid @RequestBody CreateTicketRequest req) {
        return ticketService.create(req);
    }

    @PatchMapping("/{id}/status")
    public Ticket updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest req) {
        return ticketService.updateStatus(id, req.getStatus());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        ticketService.delete(id);
    }

    @GetMapping("/{id}/comments")
        public List<TicketComment> comments(@PathVariable Long id) {
        return commentService.listByTicket(id);
}

    @PostMapping("/{id}/comments")
    public TicketComment addComment(@PathVariable Long id, @Valid @RequestBody CreateCommentRequest req) {
        return commentService.add(id, req);
    }
}
