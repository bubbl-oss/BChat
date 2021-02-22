<template type="x-template" id="chatroom-component">
  <div>
    <div class="container">
      <div
        class="align-items-center d-flex header justify-content-center text-center"
        id="header"
      >
        <h5 class="mb-0 d-inline-block">
          <span v-if="room"> {{ room.name }} </span>
        </h5>
        &nbsp;&#8226;&nbsp;
        <span id="status"></span>
      </div>

      <div id="main" class="rounded">
        <div id="chats"></div>
      </div>

      <div
        class="controls footer d-flex justify-content-center flex-column"
        style="z-index: 1"
        id="footer"
      >
        <div class="container">
          <div class="items">
            <input
              id="color-style"
              type="color"
              placeholder="#000"
              title="font color"
            />
            <div class="btn-group" role="group" aria-label="Chat Controls">
              <button
                type="button"
                id="emoji"
                value="emoji"
                title="emoji"
                class="btn btn-sm btn-outline-primary purple-border purple-text"
              >
                Emoji
              </button>
              <button
                type="button"
                id="clearBtn"
                value="clear"
                title="clear screen"
                class="btn btn-sm purple-border purple-text"
              >
                Clear
              </button>
              <button
                type="button"
                id="logoutBtn"
                value="logout"
                title="logout"
                class="btn btn-sm btn-outline-danger"
                @click="leaveRoom()"
              >
                Leave
              </button>
            </div>
            <label for="send-image" class="image-label">
              <input type="button" value="image" />
              <input id="send-image" type="file" value="image" />
            </label>
          </div>
          <div class="input-group my-2" style="flex-wrap: initial">
            <input
              type="text"
              class="form-control purple-border"
              id="message-input"
              placeholder="Enter to send"
              aria-label="Recipient's username"
              aria-describedby="button-addon2"
            />
            <button
              class="btn purple-border purple-text"
              type="button"
              id="sendBtn"
            >
              Send
            </button>
          </div>
          <div id="emoji-wrapper"></div>
        </div>
      </div>
    </div>

    <div id="login-wrapper">
      <div id="center">
        <p id="info">connecting to server...</p>
        <div id="error-notif" class="alert alert-danger" style="display: none">
          Something went wrong. You must use the first part of your AUN email:
          [firstname.lastname]@aun.edu.ng. Reload page to try again.
        </div>
        <div id="nickname-wrapper">
          <input
            type="text"
            autocomplete="off"
            placeholder="nickname"
            id="nickname-input"
          />
          <input type="button" value="OK" id="loginBtn" />
        </div>
      </div>
    </div>
  </div>
</template>
