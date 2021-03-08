<template type="x-template" id="chatroom-component">
  <div>
    <div class="container">
      <div
        class="align-items-center d-flex header justify-content-between text-center"
        id="header"
      >
        <button
          type="button"
          id="logoutBtn"
          value="logout"
          title="logout"
          class="btn btn-link"
          @click="leaveRoom()"
        >
          <img src="https://icongr.am/jam/log-out.svg?size=20&color=303030" />
        </button>
        <h5 class="mb-0 d-inline-block">
          <span v-if="room"> {{ room.name }} </span>
          &nbsp;&#8226;&nbsp;
          <span id="status"></span>
        </h5>

        <div>
          <input
            id="color-style"
            class="btn btn-sm purple-border purple-text"
            style="width: 24px;height;24px"
            type="color"
            placeholder="#000"
            title="font color"
          />
          <button
            type="button"
            id="share-room-btn"
            value="share"
            class="btn btn-sm btn-link"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            :title="`${shareEnabled ? 'Shared!' : 'Copied!'}`"
            :data-clipboard-text="copyLink"
            @click="share()"
          >
            <img
              v-if="shareEnabled"
              src="https://icongr.am/jam/user-plus.svg?size=20&color=198754"
            />
            <img
              v-else
              src="https://icongr.am/jam/files.svg?size=20&color=198754"
            />
          </button>
        </div>
      </div>

      <div id="main" class="rounded">
        <div id="chats"></div>
      </div>

      <div
        class="controls footer d-flex justify-content-center flex-column"
        style="z-index: 1"
        id="footer"
      >
        <div>
          <!-- TODO: Later maybe add these functions elsewhere! Thank you Jesus (7/3/21) -->
          <!-- <div class="items">
            <input
              id="color-style"
              class="btn btn-sm purple-border purple-text"
              type="color"
              placeholder="#000"
              title="font color"
            />
            <div class="btn-group" role="group" aria-label="Chat Controls">
              <label for="send-image" class="image-label">
                <input
                  type="button"
                  class="btn btn-sm purple-border purple-text"
                  value="image"
                />
                <input id="send-image" type="file" value="image" />
              </label>
              <button
                type="button"
                id="emoji"
                value="emoji"
                title="emoji"
                class="btn btn-sm purple-border purple-text"
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
            </div>
          </div> -->
          <div class="input-group my-2" style="flex-wrap: initial">
            <div class="dropdown dropup">
              <button
                class="btn"
                type="button"
                id="optionsBtn"
                data-bs-toggle="dropdown"
                data-bs-offset="10,10"
                aria-expanded="false"
              >
                <img
                  src="https://icongr.am/jam/smiley.svg?size=24&color=495057"
                />
              </button>

              <ul
                class="dropdown-menu"
                aria-labelledby="optionsBtn"
                style="width: 300px"
              >
                <div id="emoji-wrapper"></div>
              </ul>
            </div>

            <input
              type="text"
              class="form-control input-field"
              id="message-input"
              placeholder="Enter to send"
              aria-label="Recipient's username"
              aria-describedby="button-addon2"
            />
            <button
              class="btn purple-border bg-purple purple-text"
              type="button"
              id="sendBtn"
            >
              <img
                src="https://icongr.am/jam/paper-plane.svg?size=24&color=ffffff"
              />
            </button>
          </div>
          <!-- <div id="emoji-wrapper"></div> -->
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
