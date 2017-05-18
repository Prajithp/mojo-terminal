package Terminal;

use strict;
use warnings;

use Mojo::Base 'Mojo::EventEmitter';

use IO::Pty;
use IO::Tty::Constant;
use IO::Handle;
use POSIX qw(:sys_wait_h);
use Encode ();

sub new {
    my $self = shift->SUPER::new(@_);

    $self->{created} = time;

    $self->{cmd} ||= '/bin/bash';
    $self->{app} ||= sub { };

    $self->init;
}

sub init {
    my $self = shift;

    $self->app->log->debug("Creating IO::Pty");

    my $pty = IO::Pty->new;

    my $tty_name = $pty->ttyname;
    if (not defined $tty_name) {
        die "Could not assign a pty";
    }
    $pty->autoflush;

    $self->{pty} = $pty;

    return $self;
}

sub start {
    my $self = shift;

    $self->app->log->debug("Starting a new process");

    $self->_spawn_shell;

    $self->{handle} = $self->_build_handle;

    $self->{spawned} = 1;

    return $self;
}

sub resize {
    my ($self, $rows, $cols) = @_;

    my $winsize = pack('SSSS', $rows, $cols, 0, 0);
    ioctl($self->pty->slave, &IO::Tty::Constant::TIOCSWINSZ, $winsize);

    return;
}

sub read {
    my $self = shift;
    my ($chunk) = @_;

    $self->app->log->debug("got chunk from fd");
    $chunk = Encode::decode('UTF-8', $chunk);
    $self->emit('row_changed', $chunk);
}

sub write {
    my $self = shift;

    $self->{handle}->write(@_);

    return $self;
}

sub _build_handle {
    my $self = shift;

    my $fh = IO::Handle->new_from_fd($self->pty->fileno, 'w+'); 
    my $stream = Mojo::IOLoop::Stream->new($fh)->timeout(0);

    $self->{stream_id} = Mojo::IOLoop->stream($stream);

    $stream->on(read => sub {
        my ($stream, $bytes) = @_;

        $self->read($bytes);
    });

    $stream->on(close => sub { 
        my $stream = shift;
        close $fh;
    });

    $self->{handle} = $stream;
    
}

sub _spawn_shell {
    my $self  = shift;

    my $pty    = $self->pty;
    my $cmd    = $self->cmd;
    my $pgroup = getpgrp;

    die "Can't fork: $!" unless defined(my $pid = fork);

    if ($pid) { # Parent
        $SIG{CHLD} = sub {
            while ((my $child = waitpid(-1, WNOHANG)) > 0) {
                $self->app->log->debug("$$: Parent waiting: $child");
                $self->emit('close');
            }  
        };
        return $pid;
    }

    $self->app->log->info("Slot running: Child Pid:$$,  Parrent Pid:" . getppid);
    setpgrp($pid, $pgroup);

    my $tty      = $pty->slave;
    my $tty_name = $tty->ttyname;

    $tty->set_raw;
    $pty->set_raw; 

    $pty->make_slave_controlling_terminal;

    close($pty);
    close(STDIN);
    close(STDOUT);
    close(STDERR);

    open(STDIN,  "<&" . $tty->fileno) || die "Couldn't reopen " . $tty_name . " for reading: $!";
    open(STDOUT, ">&" . $tty->fileno) || die "Couldn't reopen " . $tty_name . " for writing: $!";
    open(STDERR, ">&" . $tty->fileno) || die "Couldn't redirect STDERR: $!";

    system 'stty sane';
   
    exec $cmd;
    die "Cannot exec '$cmd': $!";
   
}

sub cleanup { 
    my $self = shift;
    $self->{'pty'} = undef; 
    Mojo::IOLoop->remove($self->stream_id); 
}

sub created     { shift->{'created'} }
sub pty         { shift->{'pty'} }
sub cmd         { shift->{'cmd'} }
sub app         { shift->{'app'} }
sub stream_id   { shift->{'stream_id'} }
sub is_spawned  { shift->{'spawned'} }


1;
