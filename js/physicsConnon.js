//http://schteppe.github.io/cannon.js/
// three var
var camera, scene, light, renderer, canvas, controls;
var isMobile = false;
var antialias = true;

var mats = {};
var world,cannonDebugRendere;
var bodys = [];
var meshs = [];

var main={
        init:function(){
            this.initTree3D();
            //添加事件
            window.addEventListener( 'resize', this.onWindowResize, false );
            this.buildAuxSystem();
            this.initCannonPhysics();
            this.loop();
        },
        onWindowResize:function(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        },
        buildAuxSystem:function(){
        var axisHelper = new THREE.AxesHelper(1000)
        scene.add(axisHelper);
        var width=50;
        var split=10;
        var gridHelperx = new THREE.GridHelper(width,split)//长宽600等分60格1格等于10
        var gridHelpery = new THREE.GridHelper(width,split)
        var gridHelperz = new THREE.GridHelper(width,split)
        gridHelperx.rotateX(-Math.PI / 2);
        gridHelperz.rotateZ(Math.PI / 2);
        scene.add(gridHelperx);
        scene.add(gridHelpery);
        scene.add(gridHelperz);
        },
        initTree3D:function(){
        var n = navigator.userAgent;
        if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i) || n.match(/Windows Phone/i))
        { 
            isMobile = true;  antialias = false;
        }
        canvas = document.getElementById("canvas");
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight,1, 5000)
        //camera.position.set(0, 5, 20)
        camera.position.set( 0,50,20 );

        controls = new THREE.OrbitControls( camera, canvas );
        //controls.target.set(0, 0, 100);
        // controls.update();

        scene = new THREE.Scene();

        renderer = new THREE.WebGLRenderer({ canvas:canvas, precision: "mediump", antialias:antialias });
        renderer.setPixelRatio(2);
        renderer.setSize( window.innerWidth, window.innerHeight );

        var materialType = 'MeshBasicMaterial';
        if(!isMobile){
            scene.add( new THREE.AmbientLight( 0x3D4143 ) );
            light = new THREE.DirectionalLight( 0xffffff , 1.4);
            light.position.set( 300, 1000, 500 );
            light.target.position.set( 0, 0, 0 );
            light.castShadow = true;

            var d = 300;
            light.shadow.camera = new THREE.OrthographicCamera( -d, d, d, -d,  500, 1600 );
            light.shadow.bias = 0.0001;
            light.shadow.mapSize.width = light.shadow.mapSize.height = 1024;
            scene.add( light );
            materialType = 'MeshPhongMaterial';
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;//THREE.BasicShadowMap;
        }

        // background
        var buffgeoBack = new THREE.BufferGeometry();
        buffgeoBack.fromGeometry( new THREE.IcosahedronGeometry(3000,2) );
        var back = new THREE.Mesh( buffgeoBack, new THREE.MeshBasicMaterial( { map:this.TEXTURES.gradTexture([[0.75,0.6,0.4,0.25], ['#1B1D1E','#3D4143','#72797D', '#b0babf']]), side:THREE.BackSide, depthWrite: false, fog:false }  ));
        scene.add( back );

        // materials
        mats['sph']    = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(0), name:'sph' } );
        mats['box']    = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(2), name:'box' } );
        mats['cyl']    = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(4), name:'cyl' } );
        mats['ssph']   = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(1), name:'ssph' } );
        mats['sbox']   = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(3), name:'sbox' } );
        mats['scyl']   = new THREE[materialType]( {shininess: 10, map: this.TEXTURES.basicTexture(5), name:'scyl' } );
        mats['ground'] = new THREE[materialType]( {shininess: 10, color:0x3D4143, transparent:true, opacity:0.5 } );
        },
        loop:function(){
            requestAnimationFrame(function () {
                main.loop()
            })
            renderer.render(scene, camera);
            main.updatePhysics();
                
        },
        initCannonPhysics:function(){
        //添加物理世界
        world = new CANNON.World()
        world.gravity.set(0, -10, 0) // 设置 Y 轴重力 m/s²
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 5;
        cannonDebugRenderer = new THREE.CannonDebugRenderer(scene, world);
        //添加平地（Cannon的平地没有尽头）
        // plane body
        var ground_cm = new CANNON.Material()
        let groundShape = new CANNON.Plane()
        let groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape,
            material: ground_cm
        })
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI/2);
        world.add(groundBody)
        // plane mesh
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(50,1,50), mats.ground );
        mesh.position.set(0,-1,0);
        scene.add( mesh );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        //box set
        this.populate(1);
        },
        clearMesh:function(){
        var i=meshs.length;
        while (i--) scene.remove(meshs[ i ]);
        meshs = [];
        },
        addPBox(type,position,shape){
        var sphere_cm = new CANNON.Material()
        var sphereBody = new CANNON.Body({
            mass: 5,
            position: position,
            shape: shape,
            material: sphere_cm
        });
        world.addBody(sphereBody);
        return sphereBody
        },
        buildCylinder:function(shape){
        var geo = new THREE.Geometry();
        // Add vertices
        for (var i = 0; i < shape.vertices.length; i++) {
            var v = shape.vertices[i];
            geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
        }

        for(var i=0; i < shape.faces.length; i++){
            var face = shape.faces[i];

            // add triangles
            var a = face[0];
            for (var j = 1; j < face.length - 1; j++) {
                var b = face[j];
                var c = face[j + 1];
                geo.faces.push(new THREE.Face3(a, b, c));
            }
        }
        geo.computeBoundingSphere();
        geo.computeFaceNormals();
        return geo;
        },
        populate:function(n){
        // reset old
        this.clearMesh();
        var bodies = world.bodies;
        var N = bodies.length;
        for(var i=1; i !== N; i++){
            var b = bodies[i];
            world.removeBody(b);
        }

        bodys=[];

        if(n===1) type = 1
        else if(n===2) type = 2;
        else if(n===3) type = 3;
        else if(n===4) type = 4;
        
        var i =1;
        while (i--){
            if(type===4) t = Math.floor(Math.random()*3)+1;
            else t = type;
            if(t===1){
                //body
                var shape = new CANNON.Sphere(1);
                bodys[i]=this.addPBox(t,new CANNON.Vec3(0, 20, 0),shape);
                //mesh
                var sphere_geometry = new THREE.SphereGeometry( shape.radius, 8, 8);
                let sphere = new THREE.Mesh(sphere_geometry, mats.sph)
                meshs[i] =sphere;
            }else if(t===2){
                var shape = new CANNON.Box(new CANNON.Vec3(1,1,1));
                bodys[i]=this.addPBox(t,new CANNON.Vec3(0, 20, 0),shape);
                //mesh
                var box_geometry = new THREE.BoxGeometry(shape.halfExtents.x*2,shape.halfExtents.y*2,shape.halfExtents.z*2 );
                let sphere = new THREE.Mesh(box_geometry,mats.box)
                meshs[i] =sphere;
            }else if(t===3){
                var shape = new CANNON.Cylinder(0.5,0.5,2,10);//R,R,L,num
                bodys[i]=this.addPBox(t,new CANNON.Vec3(0, 20, 0),shape);
                bodys[i].quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),Math.PI/3);
                //mesh
                var cylinder_geometry=this.buildCylinder(shape);
                let sphere = new THREE.Mesh(cylinder_geometry, mats.cyl);
                meshs[i] =sphere;
            }

            meshs[i].castShadow = true;
            meshs[i].receiveShadow = true;

            scene.add( meshs[i] );
        }
        },
        updatePhysics:function(){
        cannonDebugRenderer.update();
        world.step(1 / 60);
        var x, y, z, mesh, body, i = bodys.length;
        while (i--){
            
            body = bodys[i];
            mesh = meshs[i];
            if(body.sleepState==0){
                mesh.position.copy(body.position)
                mesh.quaternion.copy(body.quaternion)
            }
        }
        },
        TEXTURES:{
        gradTexture:function(color){
            var c = document.createElement("canvas");
            var ct = c.getContext("2d");
            var size = 1024;
            c.width = 16; c.height = size;
            var gradient = ct.createLinearGradient(0,0,0,size);
            var i = color[0].length;
            while(i--){ gradient.addColorStop(color[0][i],color[1][i]); }
            ct.fillStyle = gradient;
            ct.fillRect(0,0,16,size);
            var texture = new THREE.Texture(c);
            texture.needsUpdate = true;
            return texture;
        },
        basicTexture:function(n){
            var canvas = document.createElement( 'canvas' );
            canvas.width = canvas.height = 64;
            var ctx = canvas.getContext( '2d' );
            var color;
            if(n===0) color = "#3884AA";// sphere58AA80
            if(n===1) color = "#61686B";// sphere sleep
            if(n===2) color = "#AA6538";// box
            if(n===3) color = "#61686B";// box sleep
            if(n===4) color = "#AAAA38";// cyl
            if(n===5) color = "#61686B";// cyl sleep
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 64, 64);
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.fillRect(0, 0, 32, 32);
            ctx.fillRect(32, 32, 32, 32);
    
            var tx = new THREE.Texture(canvas);
            tx.needsUpdate = true;
            return tx;
        }
    }
    }
      