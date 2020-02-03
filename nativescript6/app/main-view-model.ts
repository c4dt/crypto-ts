import { Observable } from "tns-core-modules/data/observable";
import {randomBytes} from "crypto-browserify";
import {Log} from "@dedis/cothority";
import {ByzCoinRPC} from "@dedis/cothority/byzcoin";
import {
    WebSocketConnection
} from "@dedis/cothority/network/connection";
import {WebSocketAdapter} from "@dedis/cothority/network";
import {KeyPair} from "@c4dt/dynacred";
import {NativescriptWebSocketAdapter} from "~/nativescript-ws";

export class HelloWorldModel extends Observable {

    private _counter: number;
    private _message: string;

    constructor() {
        super();

        // Initialize default values.
        this._counter = 42;
        this.updateMessage();
    }

    get message(): string {
        return this._message;
    }

    set message(value: string) {
        if (this._message !== value) {
            this._message = value;
            this.notifyPropertyChange("message", value);
        }
    }

    async onTap() {
        // Print 32 bytes of randomness
        Log.print(randomBytes(32));

        // Create a new random keypair from the dynacred library
        Log.print(new KeyPair());

        // Set websockets to nativescript-websockets and fetch the latest
        // block from the DEDIS-blockchain
        const conn = new WebSocketConnection("wss://conode.c4dt.org:7771", "byzcoin");
        const bc = await ByzCoinRPC.fromByzcoin(conn, Buffer.from("9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3", "hex"));
        Log.print(bc.getConfig());

        this._counter--;
        this.updateMessage();
    }

    private updateMessage() {
        if (this._counter <= 0) {
            this.message = "Hoorraaay! You unlocked the NativeScript clicker achievement!";
        } else {
            this.message = `${this._counter} taps left`;
        }
    }
}
