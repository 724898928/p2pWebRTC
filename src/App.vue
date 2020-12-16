<template>
  <div id="app" class="main-layout">
    <h1>{{ message }}</h1>
    <div>
      <div v-if="this.status.isLogin == false" class="login-container">
        <el-form class="login-form">
          <el-input label="userName" style="width: 200px" type="text" placeholder="请输入用户名" class="userName"
                    v-model="status.userName"/>
          <el-input label="roomId" style="width: 200px;margin-top: 10px" type="text" placeholder="请输入房间号" class="roomId"
                    v-model="status.roomId"/>
          <el-button type="submit" style="width: 200px;margin-top: 10px" class="login-join-button"
                     @click="loginHandler">Join
          </el-button>
        </el-form>
      </div>
      <div v-else-if="this.status.isVideoCall == false">
        <div v-for="(item,index) of this.status.users" v-bind:key="index">
          <div class="list-item">userName = {{ item.name }} userId ={{ item.id }}
            <div v-if="item.id !=status.userId">
              <el-button @click="handleStartCall(item.id,'video')">视频</el-button>
              <el-button @click="handleStartCall(item.id,'screen')">共享桌面</el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="this.status.remoteStream != null || this.status.localStream != null">
        <div v-if="this.status.remoteStream != null" class="remote">
          <video ref="remoteVideo" @loadstart="onLocalLoadStart" class="remoteVideo" id="remoteVideo"
                 @loadedmetadata="playRemoteVideo" autoplay
                 playsinline></video>
        </div>
        <div v-if="this.status.localStream != null" class="small">
          <video ref="localVideo" @loadstart="onLocalLoadStart" class="localVideo" id="localVideo"
                 @loadedmetadata="playLocalVideo" autoPlay
                 playsInline></video>
        </div>
        <div class="btn-tools">
          <el-button @click="this.onVideoOnClickHandler">打开/关闭视频</el-button>
          <el-button @click="this.handleUp">挂断</el-button>
          <el-button @click="this.onAudioClickHandler">打开/关闭音频</el-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import P2PVideoCall from "../public/js/P2PVideoCall";

export default {
  name: 'App',
  components: {},
  data: function () {
    return {
      message: "一对一视频通话案例",
      p2pVideoCall: null,
      localVideo: null,
      remoteVideo: null,
      status: {
        //Users数组
        users: [],
        //自己Id
        userId: null,
        //用户名
        userName: '',
        //房间号
        roomId: '111111',
        //是否正在视频通话
        isVideoCall: false,
        //是否登录房间
        isLogin: false,
        //本地流
        localStream: null,
        //远端流
        remoteStream: null,
        //禁用音频
        audioMuted: false,
        //禁用视频
        videoMuted: false,
      },
    };
  },
  mounted: function () {
    this.$nextTick(() => {
      this.localVideo = this.$refs.localVideo;
      this.remoteVideo = this.$refs.remoteVideo;
    })
  },
  methods: {
    loginHandler() {
      this.status.isLogin = true;
      this.connectServer()
    },
    connectServer() {
      // webSocket连接url
      // let p2pUrl = 'wss://' + window.location.hostname + ':8000/ws';
      let turnUrl = 'https://' + window.location.hostname + ':9000/api/turn?service=turn&username=sample'
      var p2pUrl = 'wss://' + window.location.hostname + ':8806/socket';
      console.log("信令服务器地址:" + p2pUrl);
      console.log("中转服务器地址:" + turnUrl);

      // 初始化信令 传入url及名称
      this.p2pVideoCall = new P2PVideoCall(p2pUrl, turnUrl, this.status.userName, this.status.roomId);
      let vueThis = this;
      // 监听更新用户列表事件
      if (this.p2pVideoCall) {
        this.p2pVideoCall.on('updateUserList', (users, self) => {
          vueThis.status.users = users;
          vueThis.status.userId = self;
        });

        // 监听新的呼叫事件
        this.p2pVideoCall.on('newCall', () => {
          vueThis.status.isVideoCall = true;
        });
        // 监听新本地流事件
        this.p2pVideoCall.on('localstream', (stream) => {
          vueThis.status.localStream = stream;
          // 强制重新渲染界面
          vueThis.$forceUpdate();
          vueThis.$nextTick(() => {
            vueThis.localVideo = vueThis.$refs.localVideo;
            if (vueThis.localVideo) {
              vueThis.localVideo.srcObject = stream;
            }
          })
        });
        // 监听新远端流添加事件
        this.p2pVideoCall.on('addstream', (stream) => {
          vueThis.status.remoteStream = stream;
          // 强制重新渲染界面
          vueThis.$forceUpdate();
          vueThis.$nextTick(() => {
            vueThis.remoteVideo = vueThis.$refs.remoteVideo;
            if (vueThis.remoteVideo) {
              vueThis.remoteVideo.srcObject = stream;
            }
          });
        });

        // 监听远端流移除事件
        this.p2pVideoCall.on('removestream', () => {
          vueThis.status.remoteStream = null;
        });
        //监听会话结束事件
        this.p2pVideoCall.on('hangUp', () => {
          vueThis.status.isVideoCall = false;
          vueThis.status.localStream = null;
          vueThis.status.remoteStream = null;
        });
        //监听离开事件
        this.p2pVideoCall.on('leave', () => {
          vueThis.status.isVideoCall = false;
          vueThis.status.localStream = null;
          vueThis.status.remoteStream = null;
        })
      }
    },
    //呼叫对方参与会话
    handleStartCall(remoteUserId, type) {
      this.p2pVideoCall.startCall(remoteUserId, type);
    },
    //打开/关闭本地视频
    onVideoOnClickHandler() {
      let videoMuted = !this.status.videoMuted;
      this.onToggleLocalVideoTrack(videoMuted);
      this.status.videoMuted = videoMuted
    },
    //挂断处理
    handleUp() {
      this.p2pVideoCall.hangUp();
    },
    onToggleLocalVideoTrack(muted) {
      // 获取所有视频频轨道
      let videoTracke = this.status.localStream.getVideoTracks();
      if (videoTracke.length === 0) {
        console.log("没有本地视频。");
        return;
      }
      console.log("打开/关闭本地视频。");
      // 循环迭代所有轨道
      for (var i = 0; i < videoTracke.length; ++i) {
        // 设置每个轨道的enabled值
        videoTracke[i].enabled = !muted;
      }
    },
    //打开/关闭本地音频
    onAudioClickHandler() {
      let audioMuted = !this.status.audioMuted;
      this.onToggleLocalAudioTrack(audioMuted);
      this.status.audioMuted = audioMuted;
    },
    onToggleLocalAudioTrack(muted) {
      // 获取所有音频轨道
      var audioTracks = this.status.localStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.log("没有本地音频");
        return;
      }
      console.log("打开/关闭本地音频。");
      for (var i = 0; i < audioTracks.length; ++i) {
        // 设置每个轨道的enabled值
        audioTracks[i].enabled = !muted;
      }
    },
    onLocalLoadStart() {
    //  alert("onLocalLoadStart");
    },
    onRemoteLoadStart() {
     // alert("onRemoteLoadStart");
    },
    playRemoteVideo() {
      this.remoteVideo.play();
    },
    playLocalVideo() {
      this.localVideo.play();
    }

  },
  watch: {}

}
</script>

<style>
.remote {
  /*  绝对定位*/
  position: absolute;
  /*  上下左右为0px表示撑满整个容器*/
  left: 0px;
  right: 0px;
  top: 0px;
  bottom: 0px;
  /*  背景色*/
  backgroundColor: #323232;
  /*//远端大视频放在底部*/
  zIndex: 0;
}

.remoteVideo {
  objectFit: contain;
  width: 100%;
  height: 100%;
}

.small {
  display: flex;
  justifyContent: center;
  alignItems: center;
  /* //绝对定位*/
  position: absolute;
  /*//指定宽*/
  width: 192px;
  /*//指定高*/
  height: 108px;
  /* //底部*/
  bottom: 60px;
  /* //右侧*/
  right: 10px;
  /*//边框宽度*/
  borderWidth: 2px;
  /* //边框样式*/
  borderStyle: solid;
  /* //边框颜色*/
  borderColor: #ffffff;
  /*  //溢出隐藏*/
  overflow: hidden;
  /* //设置此属性可以使得视频在最上层*/
  zIndex: 99;
  /*//边框弧度*/
  borderRadius: 4px;
}

.localVideo {
  width: 100%;
  height: 100%;
  objectFit: cover;
}

.main-layout {
  width: 100%;
  height: 100%;
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 540px;
}

.login-form {
  width: 360px;
  height: 320px;
}

.login-input-icon {
  color: rgba(0, 0, 0, 0.25);
}

.button {
  margin-right: 10px;
}

.btn-tools {
  position: absolute;
  bottom: 20px;
  left: 0px;
  right: 0px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.el-button {
  margin-top: 10px;
}

.login-join-button {
  width: 200px;
  margin-right: 10px;
  margin-top: 10px;
}

.list-item {
  display: flex;
  justify-content: center;
  align-items: center;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

</style>
