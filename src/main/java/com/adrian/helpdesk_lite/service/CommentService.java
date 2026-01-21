package com.adrian.helpdesk_lite.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.adrian.helpdesk_lite.dto.CreateCommentRequest;
import com.adrian.helpdesk_lite.model.Ticket;
import com.adrian.helpdesk_lite.model.TicketComment;
import com.adrian.helpdesk_lite.repository.CommentRepository;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketService ticketService;

    public CommentService(CommentRepository commentRepository, TicketService ticketService) {
        this.commentRepository = commentRepository;
        this.ticketService = ticketService;
    }

    @Transactional(readOnly = true)
    public List<TicketComment> listByTicket(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional
    public TicketComment add(Long ticketId, CreateCommentRequest req) {
        Ticket t = ticketService.get(ticketId);

        TicketComment c = new TicketComment();
        c.setTicket(t);

        String msg = (req.getMessage() == null) ? "" : req.getMessage().trim();
        if (msg.isBlank()) {
            throw new IllegalArgumentException("El comentario no puede estar vacío");
        }

        c.setMessage(msg);
        return commentRepository.save(c);
    }
}

