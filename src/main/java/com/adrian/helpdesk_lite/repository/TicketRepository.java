package com.adrian.helpdesk_lite.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.adrian.helpdesk_lite.model.Ticket;
import com.adrian.helpdesk_lite.model.TicketStatus;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByStatusOrderByUpdatedAtDesc(TicketStatus status);

    List<Ticket> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByUpdatedAtDesc(
            String title, String description
    );

    List<Ticket> findByStatusAndTitleContainingIgnoreCaseOrStatusAndDescriptionContainingIgnoreCaseOrderByUpdatedAtDesc(
            TicketStatus status1, String title,
            TicketStatus status2, String description
    );
}
