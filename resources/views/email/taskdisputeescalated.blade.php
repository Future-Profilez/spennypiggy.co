@extends('email.template')

@php
    $emailTitle = 'Dispute Escalated - Spenny Piggy';
    $title = 'Dispute Escalated';
    
    if ($role == 'creator') {
        $message = "The proof for task '{$task->title}' has been rejected multiple times. The dispute has been escalated to the administrator for review. Please wait for further instructions.";
    } elseif ($role == 'admin') {
        $message = "A dispute has been escalated for task '{$task->title}'. The proof has been rejected multiple times. Please review the dispute in the admin panel.";
    } else {
        $message = "You have rejected the proof for task '{$task->title}' multiple times. The dispute has been escalated to the administrator for review. Please wait for further instructions.";
    }

    $bodyContent = '
        <div style="text-align: center;">
            <div style="margin-bottom: 24px;">
                <a href="https://spennypiggy.co"><img alt="Spenny Piggy logo" width="119" src="https://ucarecdn.com/2c2af8ee-fbdb-4d38-9ba4-3de474410a20/emaillogo.png" style="border:none"></a>
            </div>
            <h1 class="headline" style="text-align: center;">
                ⚠️ Dispute Escalated
            </h1>
            <p style="text-align: center; color: #4D4D4D;">
                ' . e($message) . '
            </p>
             <p style="text-align: center; color: #4D4D4D;">
                <strong>Order ID:</strong> ' . $purchase->uuid . '
            </p>
            <div style="margin-top: 30px;">
                <a href="'. route('task.show', $task->uuid) .'" style="display: inline-block; background-color: #F94F97; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Task</a>
            </div>
        </div>
    ';
@endphp
