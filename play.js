var canvas;
var context;
var w;
var h;

var m_x = 100;
var m_y = 100;
var focus = -1;
var select_1 = -1, select_2 = -1;
var last_select = 1;
var connections = new Array();
var spring_effect = 1;
var paused = 0;
var int_id;

var G=9.8;
var S_CONSTANT=20;
var S_DAMPING=2;
var P_DAMPING=0;
var DT=0.075;
var N=9;
var points = new Array();
var springs = new Array();
var lines = new Array();

function init() {

    canvas = document.getElementById("canvas");

    if( canvas.getContext ) {

        context = canvas.getContext("2d");
        context.font = "20px";
        
        w = canvas.width;
        h = canvas.height;

        for( var i=0; i<100; i++ ) {
            points[i] = new Point(600*Math.random()+100,
                                	200*Math.random()+100,
                                	0,
                                	0,
                                	1,
                                	P_DAMPING);
        }

        int_id = setInterval(draw,DT*100);
        
    }
}

function Point(x,y,vx,vy,m,b) {

    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.m = m;
    this.ax = 0.0;
    this.ay = 0.0;

    this.update = function() {
        
        this.vx += this.ax*DT;
        this.vy += this.ay*DT + G*DT;

        /*
        for( var i=0; i<N; i++ ) {
            for( var j=0; j<lines.length; j++ ) {
                collide_point_line(points[i],lines[j]);
            }
            for( var j=i+1; j<N; j++ ) {
                collide_point_point(points[i],points[j])
            }
        }
        */

        this.x += this.vx*DT;
        this.y += this.vy*DT;

        if( this.x < 10 ) { this.x = 10; this.vx = 0; }
        if( this.x > w-10 ) { this.x = w-10; this.vx = 0; }
        if( this.y < 10 ) { this.y = 10; this.vy = 0; }
        if( this.y > h-40 ) { this.y = h-40; this.vy = 0; }

    }

    this.draw = function(index) {

        context.save();

        if( index == 1 )
            context.fillStyle = "rgb(63,63,127)";
        else if( index == 2 )
            context.fillStyle = "rgb(63,63,127)";
        else
            context.fillStyle = "rgb(0,0,0)";

        context.beginPath();
        context.arc(this.x,this.y,10,0,2*Math.PI,true);
        context.closePath();
        context.fill();

        context.restore();

    }

}

function Spring(h,t,l,k,b) {

    this.head = h;
    this.tail = t;
    this.length = l;
    this.dist = 0;
    this.k = k;
    this.b = b;
    this.vr = 0;

    this.pull = function() {

        var dx = this.head.x - this.tail.x;
        var dy = this.head.y - this.tail.y;
        this.dist = Math.sqrt(dx*dx+dy*dy+0.001);
        var disp = this.dist - this.length;

        var fx = (this.k*disp + this.b*this.vr)*dx/this.dist;
        var fy = (this.k*disp + this.b*this.vr)*dy/this.dist;

        this.head.ax -= fx/this.head.m;
        this.head.ay -= fy/this.head.m;
        this.tail.ax += fx/this.tail.m;
        this.tail.ay += fy/this.tail.m;

    }

    this.update_velocity = function() {

        var dx = this.head.x - this.tail.x;
        var dy = this.head.y - this.tail.y;
        var dist_new = Math.sqrt(dx*dx+dy*dy);

        this.vr = (dist_new - this.dist)/DT;

    }

    this.draw = function() {

        var dx = this.head.x - this.tail.x;
        var dy = this.head.y - this.tail.y;
        var dist = Math.sqrt(dx*dx+dy*dy);
        var theta = Math.atan2(dy,dx);
        
        context.save();

        context.translate(this.head.x,this.head.y);

        context.save();

        context.rotate(theta+Math.PI);
        context.scale(dist/this.length,1)

        context.beginPath();
        context.moveTo(0,0);
        if( spring_effect == 1 ) {
            var pos = 0;
            var sign = 1;
            while( pos < this.length ) {
                context.quadraticCurveTo(pos+5,sign*10,pos+10,0);
                sign *= -1;
                pos += 10
            }
        } else {
            context.lineTo(this.length,0);
        }

        context.restore();

        context.lineWidth = 3;
        context.lineJoin = "round";
        context.lineCap = "round";
        context.stroke();
        //context.closePath();
        
        context.restore();

    }

}

function Line(ax,ay,bx,by) {

    this.ax = ax;
    this.ay = ay;
    this.bx = bx;
    this.by = by;

    this.draw = function() {

        context.save();

        context.beginPath();
        context.moveTo(this.ax,this.ay);
        context.lineTo(this.bx,this.by);
        context.closePath();

        context.lineWidth = 3;
        context.lineJoin = "round";
        context.lineCap = "round";
        context.stroke();

        context.restore();

    }

}

function collide_point_line(p,l) {
    
    var r = ((p.x-l.ax)*(l.bx-l.ax) + (p.y-l.ay)*(l.by-l.ay))/((l.bx-l.ax)*(l.bx-l.ax)+(l.by-l.ay)*(l.by-l.ay));
    var cx = 0;
    var cy = 0;

    if( r < 0 ) {
        cx = l.ax;
        cy = l.ay;
    } else if( r > 1 ) {
        cx = l.bx;
        cy = l.by;
    } else {
        cx = l.ax + r*(l.bx-l.ax);
        cy = l.ay + r*(l.by-l.ay);
    }
    
    var dx = p.x-cx;
    var dy = p.y-cy;
    var dist = Math.sqrt(dx*dx+dy*dy);

    if( dist < 10 && dist != 0 ) {
        var nx = dx/dist;
        var ny = dy/dist;
        var projection = p.vx*nx+p.vy*ny;
        p.x += nx*(10-dist);
        p.y += ny*(10-dist);
        p.vx -= projection*nx;
        p.vy -= projection*ny;
    }

}

function collide_point_point(p1,p2) {

    var dx = p1.x-p2.x;
    var dy = p1.y-p2.y;
    var dist = Math.sqrt(dx*dx+dy*dy);

    if( dist < 20 && dist != 0 ) {
        var nx = dx/dist;
        var ny = dy/dist;
        var projection1 = p1.vx*nx+p1.vy*ny;
        var projection2 = p1.vx*nx+p1.vy*ny;
        p1.x += nx*(20-dist)/2;
        p1.y += ny*(20-dist)/2;
        p2.x -= nx*(20-dist)/2;
        p2.y -= ny*(20-dist)/2;
        p1.vx -= projection1*nx;
        p1.vy -= projection1*ny;        
        p2.vx += projection2*nx;
        p2.vy += projection2*ny;        
    }

}

function draw() {
    
    erase();

    context.save();
    context.fillStyle = "rgb(200,200,200)";
    context.rect(0,h-30,w,30);
    context.fill();
    context.restore();

    for( var i=0; i<N; i++ ) {
        points[i].ax = 0;
        points[i].ay = 0;
    }
    for( var i=0; i<springs.length; i++ )
        springs[i].pull();
    for( var i=0; i<N; i++ ) {
        if( focus == i ) {

            if( m_x < w-10 && m_x > 10 )
                points[i].x = m_x;
            else if( m_x >= w-10 )
                points[i].x = w-10;
            else 
                points[i].x = 10;

            if( m_y < h-40 && m_y > 10 )
                points[i].y = m_y;
            else if( m_y >= h-40 )
                points[i].y = h-40;
            else 
                points[i].y = 10;

            points[i].vx = 0;
            points[i].vy = 0;
        } else {
            points[i].update();
        }
    }
    for( var i=0; i<springs.length; i++ )
        springs[i].update_velocity();

    for( var i=0; i<springs.length; i++ )
        springs[i].draw();
    for( var i=0; i<lines.length; i++ )
        lines[i].draw();
    for( var i=0; i<N; i++ ) {
        if( i == select_1 )
            points[i].draw(1);
        else if( i == select_2 )
            points[i].draw(2);
        else
            points[i].draw(0);
            
    }
    
}

function erase() {
    
    context.clearRect(0,0,canvas.width,canvas.height);
    
}

function mouse_move(event) {

    var dx, dy, dist;

    m_x = event.clientX-9;
    m_y = event.clientY-9;

    for( var i=0; i<N; i++ ) {
        dx = m_x-points[i].x;
        dy = m_y-points[i].y;
        dist = Math.sqrt(dx*dx+dy*dy);
        if( dist < 10 ) {
            canvas.style.cursor = "pointer";
            break;
        }
    }
    if( i == N )
        canvas.style.cursor = "default";

}

function mouse_down(event) {

    var dx, dy, dist;

    m_d = 1;
    m_x = event.clientX-9;
    m_y = event.clientY-9;

    for( var i=0; i<N; i++ ) {
        dx = m_x-points[i].x;
        dy = m_y-points[i].y;
        dist = Math.sqrt(dx*dx+dy*dy);
        if( dist < 10 ) {
            focus = i;
            break;
        }
    }

}

function mouse_up(event) {

    var dx, dy, dist;

    m_d = 0;
    m_x = event.clientX-9;
    m_y = event.clientY-9;
    focus = -1;

    for( var i=0; i<N; i++ ) {
        dx = m_x-points[i].x;
        dy = m_y-points[i].y;
        dist = Math.sqrt(dx*dx+dy*dy);
        if( dist < 10 ) {
            if( last_select == 1 ) {
                if( select_1 == -1 ) 
                    select_1 = i;
                else if( select_1 != i ) {
                    select_2 = i;
                    last_select = 2;
                }
            } else if( last_select == 2 ) {
                if( select_2 == -1 ) 
                    select_2 = i;
                else if( select_2 != i ) {
                    select_1 = i;
                    last_select = 1;
                }
            }
            break;
        }
    }
    if( i == N ) {
        if( select_2 != -1 )
            select_2 = -1;
        else
            select_1 = -1;
    }

}

function mouse_click(event) {

}

function key_up(event) {

    var code = event.keyCode?event.keyCode:event.which;

    switch( code ) {
    case 38:
        if( select_1 != -1 && select_2 != -1 ) {
            var c_length = connections.length;
            for( var i=0; i<c_length; i++ ) {
                if( (connections[i][0] == select_1 &&
                     connections[i][1] == select_2) ||
                    (connections[i][0] == select_2 &&
                     connections[i][1] == select_1) ) {
                    if( springs[i].length < 200 )
                        springs[i].length += 10;
                }
            }
        }
        break;
    case 40:
        if( select_1 != -1 && select_2 != -1 ) {
            var c_length = connections.length;
            for( var i=0; i<c_length; i++ ) {
                if( (connections[i][0] == select_1 &&
                     connections[i][1] == select_2) ||
                    (connections[i][0] == select_2 &&
                     connections[i][1] == select_1) ) {
                    if( springs[i].length > 20 )
                        springs[i].length -= 10;
                }
            }
        }
        break;
    case 83: // new spring (or remove spring)
        if( select_1 != -1 && select_2 != -1 ) {
            var c_length = connections.length;
            for( var i=0; i<c_length; i++ ) {
                if( (connections[i][0] == select_1 &&
                     connections[i][1] == select_2) ||
                    (connections[i][0] == select_2 &&
                     connections[i][1] == select_1) ) {
                    for( j=i; j<springs.length; j++ ) 
                        springs[j] = springs[j+1];
                    springs.length -= 1;
                    for( j=i; j<c_length; j++ ) 
                        connections[j] = connections[j+1];
                    connections.length -= 1;
                    break;
                }
            }
            if( i == c_length ) {
                connections[c_length] = [select_1,select_2];
                springs[c_length] = new Spring(points[select_1],
                                            	 points[select_2],
                                            	 50,
                                            	 S_CONSTANT,
                                            	 S_DAMPING);
            }
        }
        break;
    case 69: // change spring effect
        spring_effect = (spring_effect==1?0:1);
        break;
    case 80:
        if( paused == 0 ) {
            clearInterval(int_id);
            paused = 1;
        }	else {
            int_id = setInterval(draw,DT*100);
            paused = 0;
        }
        break;
    case 71:  // gravity on/off
        if( G != 0 )
            G = 0;
        else
            G = 9.8;
        break;
    }

}
