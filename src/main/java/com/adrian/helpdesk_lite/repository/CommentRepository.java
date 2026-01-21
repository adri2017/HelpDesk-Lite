package com.adrian.helpdesk_lite.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.adrian.helpdesk_lite.model.TicketComment;

public interface CommentRepository extends JpaRepository<TicketComment, Long> {

    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}

