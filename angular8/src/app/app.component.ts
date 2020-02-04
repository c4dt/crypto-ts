import {Component, OnInit} from '@angular/core';
import {Log} from "@dedis/cothority";
import {ByzCoinRPC} from "@dedis/cothority/byzcoin";
import {WebSocketConnection} from "@dedis/cothority/network/connection";
import {randomBytes} from "crypto";
import {KeyPair} from "@c4dt/dynacred";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular8';

  async ngOnInit(){
    // Print 32 random bytes
    Log.print(randomBytes(32));

    // Create a new random keypair from the dynacred library
    Log.print(new KeyPair());

    // Get the latest block from the DEDIS byzcoin
    const conn = new WebSocketConnection("wss://conode.c4dt.org:7771", "byzcoin");
    const bc = await ByzCoinRPC.fromByzcoin(conn, Buffer.from("9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3", "hex"));
    Log.print(bc.getConfig());
  }

}
