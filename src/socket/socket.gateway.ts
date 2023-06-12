import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import {Server, Socket} from "socket.io";
import {Injectable} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {loginData, UserService} from "../users/user.service";
import {AuthService} from "../auth/auth.service";


interface responseAuth {
  userData:loginData
}

// const port = Number(process.env.CURRENT_SERVER_URL)
// console.log(port)
@Injectable()
@WebSocketGateway({cors:{origin:'*'}} )
export class SocketGateway implements OnGatewayDisconnect {
  handleDisconnect(client: any): any {
    console.log('disconnect')
  }

  constructor(
      private authService:AuthService,
      private jwtService:JwtService,
  ) {
  }

  @WebSocketServer()
  server:Server;

  @SubscribeMessage('auth/code')
  async handleAuthCode(
      @MessageBody() data:any,
      @ConnectedSocket() client:Socket
  ) {
    const randomAuthCode = await this.authService.generateTvAuthCode(client.id);
    return  randomAuthCode;
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data:any, @ConnectedSocket() client:Socket) {
    return 'aboba'
  }

  sendAuthDetails(sessionId:string,loginData:loginData) {
    const socket = this.server.sockets.sockets.get(sessionId);
    socket.emit("auth/data", loginData);
    socket.disconnect();
  }


}
