package com.adrian.helpdesk_lite.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.adrian.helpdesk_lite.dto.CreateTicketRequest;
import com.adrian.helpdesk_lite.exception.NotFoundException;
import com.adrian.helpdesk_lite.model.Ticket;
import com.adrian.helpdesk_lite.model.TicketPriority;
import com.adrian.helpdesk_lite.model.TicketStatus;
import com.adrian.helpdesk_lite.repository.TicketRepository;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public List<Ticket> list(TicketStatus status, String q) {
        boolean hasQ = q != null && !q.trim().isEmpty();

        if (status != null && hasQ) {
            String query = (q == null) ? "" : q.trim();
            return ticketRepository
                    .findByStatusAndTitleContainingIgnoreCaseOrStatusAndDescriptionContainingIgnoreCaseOrderByUpdatedAtDesc(
                            status, query, status, query
                    );
        }

        if (status != null) {
            return ticketRepository.findByStatusOrderByUpdatedAtDesc(status);
        }

        if (hasQ) {
            String query = q.trim();
            return ticketRepository
                    .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByUpdatedAtDesc(query, query);
        }

        return ticketRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .toList();
    }

    public Ticket get(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket no encontrado: " + id));
    }

    @Transactional
    public Ticket create(CreateTicketRequest req) {
        Ticket t = new Ticket();
        t.setTitle(req.getTitle().trim());
        t.setDescription(req.getDescription().trim());
        t.setCategory(req.getCategory().trim());
        t.setPriority(req.getPriority() == null ? TicketPriority.MEDIUM : req.getPriority());
        t.setStatus(TicketStatus.OPEN);
        return ticketRepository.save(t);
    }

    @Transactional
    public Ticket updateStatus(Long id, TicketStatus status) {
        Ticket t = get(id);
        t.setStatus(status);
        return t; // JPA flush
    }

    public void delete(Long id) {
        Ticket t = get(id);
        ticketRepository.delete(t);
    }

    

}


